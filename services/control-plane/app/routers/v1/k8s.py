"""
DevForge OS — Kubernetes control-plane API.

The operator POSTs detected incidents here; the control plane runs AI root-cause
analysis, persists everything tenant-scoped, and streams live events to the
dashboard over WebSocket. This is the heart of the self-healing loop.

    operator  ──POST /v1/k8s/diagnose──▶  [RCA engine + DB + eventbus]
    operator  ──POST /v1/k8s/remediate─▶  [outcome + audit + eventbus]
    dashboard ──WS   /v1/k8s/stream────▶  [live incident/remediation feed]
"""

from __future__ import annotations

import asyncio
import time

import structlog
from fastapi import (
    APIRouter,
    Depends,
    HTTPException,
    Query,
    WebSocket,
    WebSocketDisconnect,
    status,
)
from sqlalchemy.ext.asyncio import AsyncSession

from app.db import get_session
from app.db import repository as repo
from app.deps import TenantContext, tenant_context
from app.models import Remediation, utcnow
from app.schemas.k8s import (
    AuditOut,
    ClusterSnapshotIn,
    DiagnoseResponse,
    IncidentContext,
    IncidentOut,
    OkResponse,
    OverviewResponse,
    RemediateReport,
    RemediationOut,
    SnapshotOut,
)
from app.services import k8s_rca
from app.services.ai import get_ai_provider
from app.services.eventbus import get_event_bus

logger = structlog.get_logger(__name__)
router = APIRouter(prefix="/k8s", tags=["kubernetes"])


@router.post("/diagnose", response_model=DiagnoseResponse, summary="Diagnose a cluster incident")
async def diagnose_incident(
    payload: IncidentContext,
    ctx: TenantContext = Depends(tenant_context),
    session: AsyncSession = Depends(get_session),
) -> DiagnoseResponse:
    start = time.perf_counter()
    provider = get_ai_provider()

    rca, ai = await k8s_rca.diagnose(provider, payload)
    model_used = ai.model_id if ai else "deterministic"
    provider_name = ai.provider if ai else "deterministic"

    existing = await repo.find_open_incident_by_signature(
        session, ctx.tenant_id, payload.namespace, payload.kind, payload.name, payload.reason
    )
    if existing is not None:
        incident = existing
        incident.summary = rca.summary
        incident.root_cause = rca.root_cause
        incident.confidence = rca.confidence
        incident.evidence = rca.evidence
        incident.remediation = rca.remediation.model_dump()
        incident.model_used = model_used
    else:
        incident = await repo.create_incident(
            session,
            tenant_id=ctx.tenant_id,
            cluster=payload.cluster,
            namespace=payload.namespace,
            kind=payload.kind,
            name=payload.name,
            reason=payload.reason,
            severity=payload.severity,
            status="diagnosing",
            summary=rca.summary,
            root_cause=rca.root_cause,
            confidence=rca.confidence,
            evidence=rca.evidence,
            remediation=rca.remediation.model_dump(),
            raw_context=payload.model_dump(),
            model_used=model_used,
        )

    rem = await repo.create_remediation(
        session,
        tenant_id=ctx.tenant_id,
        incident_id=incident.id,
        action=rca.remediation.action,
        target=rca.remediation.target,
        mode=rca.remediation.mode,
        status="proposed",
        rationale=rca.remediation.rationale,
        patch=rca.remediation.patch,
        risk=rca.remediation.risk,
    )

    incident.status = "remediating" if rca.remediation.mode == "auto" else "suggested"
    await repo.write_audit(
        session,
        tenant_id=ctx.tenant_id,
        action="incident.diagnosed",
        actor="control-plane",
        resource_type="Incident",
        resource_id=incident.id,
        payload={"reason": payload.reason, "action": rca.remediation.action, "model": model_used},
    )
    await session.commit()

    latency_ms = round((time.perf_counter() - start) * 1000.0, 2)
    await get_event_bus().publish(
        {
            "type": "incident.diagnosed",
            "tenant_id": ctx.tenant_id,
            "incident": IncidentOut.model_validate(incident).model_dump(mode="json"),
            "remediation_id": rem.id,
            "latency_ms": latency_ms,
        }
    )
    logger.info(
        "k8s.diagnosed",
        tenant=ctx.tenant_id,
        reason=payload.reason,
        action=rca.remediation.action,
        provider=provider_name,
    )
    return DiagnoseResponse(
        incident_id=incident.id,
        remediation_id=rem.id,
        status=incident.status,
        rca=rca,
        model_used=model_used,
        provider=provider_name,
        latency_ms=latency_ms,
        cached=False,
    )


@router.post("/remediate", response_model=OkResponse, summary="Report a remediation outcome")
async def report_remediation(
    payload: RemediateReport,
    ctx: TenantContext = Depends(tenant_context),
    session: AsyncSession = Depends(get_session),
) -> OkResponse:
    incident = await repo.get_incident(session, ctx.tenant_id, payload.incident_id)
    if incident is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Unknown incident")

    rem: Remediation | None = None
    if payload.remediation_id:
        rem = await session.get(Remediation, payload.remediation_id)

    now = utcnow()
    if payload.status == "applied":
        incident.status = "resolved"
        incident.resolved_at = now
        if rem is not None:
            rem.status = "applied"
            rem.applied_at = now
    elif payload.status == "failed":
        incident.status = "failed"
        if rem is not None:
            rem.status = "failed"
    elif payload.status == "approved":
        incident.status = "remediating"
        if rem is not None:
            rem.status = "approved"
    elif payload.status == "skipped":
        incident.status = "suggested"
        if rem is not None:
            rem.status = "skipped"

    await repo.write_audit(
        session,
        tenant_id=ctx.tenant_id,
        action=f"remediation.{payload.status}",
        actor=payload.detail.split(":")[0] if payload.detail else "operator",
        resource_type="Remediation",
        resource_id=payload.remediation_id or incident.id,
        payload={"action": payload.action, "target": payload.target, "detail": payload.detail},
    )
    await session.commit()

    await get_event_bus().publish(
        {
            "type": "incident.remediated",
            "tenant_id": ctx.tenant_id,
            "incident": IncidentOut.model_validate(incident).model_dump(mode="json"),
            "outcome": payload.status,
            "action": payload.action,
        }
    )
    logger.info(
        "k8s.remediated", tenant=ctx.tenant_id, incident=incident.id, outcome=payload.status
    )
    return OkResponse(ok=True, detail=f"incident {incident.id} → {incident.status}")


@router.post("/snapshot", response_model=OkResponse, summary="Ingest a cluster snapshot")
async def ingest_snapshot(
    payload: ClusterSnapshotIn,
    ctx: TenantContext = Depends(tenant_context),
    session: AsyncSession = Depends(get_session),
) -> OkResponse:
    snap = await repo.create_snapshot(session, tenant_id=ctx.tenant_id, **payload.model_dump())
    await session.commit()
    await get_event_bus().publish(
        {
            "type": "snapshot",
            "tenant_id": ctx.tenant_id,
            "snapshot": SnapshotOut.model_validate(snap).model_dump(mode="json"),
        }
    )
    return OkResponse(ok=True, detail=f"snapshot {snap.id} stored")


@router.get("/incidents", response_model=list[IncidentOut], summary="List incidents")
async def list_incidents(
    ctx: TenantContext = Depends(tenant_context),
    session: AsyncSession = Depends(get_session),
    limit: int = Query(default=100, ge=1, le=500),
    status_filter: str | None = Query(default=None, alias="status"),
) -> list[IncidentOut]:
    rows = await repo.list_incidents(session, ctx.tenant_id, limit=limit, status=status_filter)
    return [IncidentOut.model_validate(r) for r in rows]


@router.get("/incidents/{incident_id}", response_model=IncidentOut, summary="Get one incident")
async def get_incident(
    incident_id: str,
    ctx: TenantContext = Depends(tenant_context),
    session: AsyncSession = Depends(get_session),
) -> IncidentOut:
    incident = await repo.get_incident(session, ctx.tenant_id, incident_id)
    if incident is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Unknown incident")
    return IncidentOut.model_validate(incident)


@router.get("/remediations", response_model=list[RemediationOut], summary="List remediations")
async def list_remediations(
    ctx: TenantContext = Depends(tenant_context),
    session: AsyncSession = Depends(get_session),
    limit: int = Query(default=100, ge=1, le=500),
) -> list[RemediationOut]:
    rows = await repo.list_remediations(session, ctx.tenant_id, limit=limit)
    return [RemediationOut.model_validate(r) for r in rows]


@router.get("/audit", response_model=list[AuditOut], summary="List audit log")
async def list_audit(
    ctx: TenantContext = Depends(tenant_context),
    session: AsyncSession = Depends(get_session),
    limit: int = Query(default=100, ge=1, le=500),
) -> list[AuditOut]:
    rows = await repo.list_audit(session, ctx.tenant_id, limit=limit)
    return [AuditOut.model_validate(r) for r in rows]


@router.get("/overview", response_model=OverviewResponse, summary="Dashboard overview snapshot")
async def overview(
    ctx: TenantContext = Depends(tenant_context),
    session: AsyncSession = Depends(get_session),
) -> OverviewResponse:
    stats = await repo.incident_stats(session, ctx.tenant_id)
    snap = await repo.latest_snapshot(session, ctx.tenant_id)
    incidents = await repo.list_incidents(session, ctx.tenant_id, limit=25)
    rems = await repo.list_remediations(session, ctx.tenant_id, limit=25)
    return OverviewResponse(
        stats=stats,
        snapshot=SnapshotOut.model_validate(snap) if snap else None,
        recent_incidents=[IncidentOut.model_validate(i) for i in incidents],
        recent_remediations=[RemediationOut.model_validate(r) for r in rems],
    )


@router.websocket("/stream")
async def stream(websocket: WebSocket, tenant: str = Query(default="demo")) -> None:
    """Live incident/remediation/snapshot feed for the dashboard."""
    await websocket.accept()
    bus = get_event_bus()
    queue = bus.subscribe()
    try:
        await websocket.send_json({"type": "connected", "tenant_id": tenant})
        while True:
            try:
                event = await asyncio.wait_for(queue.get(), timeout=15.0)
            except asyncio.TimeoutError:
                await websocket.send_json({"type": "ping"})  # keepalive + disconnect detection
                continue
            event_tenant = event.get("tenant_id")
            if event_tenant in (None, tenant):
                await websocket.send_json(event)
    except WebSocketDisconnect:
        pass
    except Exception as exc:
        logger.info("k8s.stream_closed", error=str(exc))
    finally:
        bus.unsubscribe(queue)
