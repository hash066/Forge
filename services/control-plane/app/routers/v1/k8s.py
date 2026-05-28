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
from typing import Any

from pydantic import BaseModel, Field

from app.config import get_settings
from app.schemas.common import StrictModel
from app.services import k8s_rca
from app.services.ai import AIProviderError, get_ai_provider
from app.services.eventbus import get_event_bus
from app.services.prompts import CLUSTER_ADVISOR_SYSTEM, ask_cluster

logger = structlog.get_logger(__name__)
router = APIRouter(prefix="/k8s", tags=["kubernetes"])


class AskRequest(StrictModel):
    question: str = Field(..., min_length=3, max_length=2000)


class AskResponse(StrictModel):
    answer: str
    sources: list[str]
    model_used: str
    provider: str


def _offline_answer(context: dict) -> str:
    """Useful deterministic answer when no live model is configured."""
    snap = context.get("snapshot") or {}
    incs = context.get("incidents") or []
    open_incs = [i for i in incs if i.get("status") != "resolved"]
    top = (
        ", ".join(f"{i['namespace']}/{i['name']} ({i['reason']})" for i in open_incs[:3])
        or "none"
    )
    return (
        f"Cluster health is {snap.get('health_score', 100)}%. There are {len(open_incs)} open "
        f"incident(s) of {len(incs)} total. Most pressing: {top}. Detected cost waste "
        f"${snap.get('monthly_waste_usd', 0):.0f}/mo and {snap.get('security_findings', 0)} "
        "security finding(s). Set OPENAI_API_KEY for a full natural-language answer."
    )


# ── Settings / RemediationPolicy ───────────────────────────────────────────────
class PolicyUpdate(StrictModel):
    mode: str | None = None
    max_auto_risk: str | None = None
    excluded_namespaces: list[str] | None = None
    allowed_actions: list[str] | None = None
    notify_webhook: str | None = None


class SettingsResponse(BaseModel):
    ai_provider: str
    ai_model: str
    ai_connected: bool
    policy: dict[str, Any]


_RISK_ORDER = {"low": 1, "medium": 2, "high": 3}


def _policy_dict(policy: Any, default_mode: str) -> dict[str, Any]:
    if policy is None:
        return {
            "mode": default_mode,
            "max_auto_risk": "low",
            "excluded_namespaces": [],
            "allowed_actions": [],
            "notify_webhook": "",
        }
    return {
        "mode": policy.mode,
        "max_auto_risk": policy.max_auto_risk,
        "excluded_namespaces": policy.excluded_namespaces or [],
        "allowed_actions": policy.allowed_actions or [],
        "notify_webhook": policy.notify_webhook or "",
    }


def _effective_mode(
    policy: Any, plan_mode: str, plan_risk: str, plan_action: str, namespace: str, default_mode: str
) -> str:
    """Resolve the actual remediation mode for an incident given the tenant policy."""
    if policy is None:
        return plan_mode if plan_mode in ("auto", "suggest") else default_mode
    if policy.mode in ("off", "suggest"):
        return "suggest"  # never auto-act
    # mode == auto: only within the risk ceiling, allowed action, non-excluded namespace
    if namespace in (policy.excluded_namespaces or []):
        return "suggest"
    if policy.allowed_actions and plan_action not in policy.allowed_actions:
        return "suggest"
    if _RISK_ORDER.get(plan_risk, 1) > _RISK_ORDER.get(policy.max_auto_risk, 1):
        return "suggest"
    return "auto"


def _build_settings_response(provider: Any, policy: Any) -> SettingsResponse:
    cfg = get_settings()
    ai_model = cfg.openai_model if cfg.ai_provider == "openai" else cfg.aws_bedrock_model_id
    return SettingsResponse(
        ai_provider=provider.name,
        ai_model=ai_model,
        ai_connected=provider.name != "offline",
        policy=_policy_dict(policy, cfg.remediation_default_mode),
    )


@router.get("/settings", response_model=SettingsResponse, summary="Get AI status + remediation policy")
async def get_settings_endpoint(
    ctx: TenantContext = Depends(tenant_context),
    session: AsyncSession = Depends(get_session),
) -> SettingsResponse:
    policy = await repo.get_policy(session, ctx.tenant_id)
    return _build_settings_response(get_ai_provider(), policy)


@router.put("/settings", response_model=SettingsResponse, summary="Update the remediation policy")
async def put_settings_endpoint(
    payload: PolicyUpdate,
    ctx: TenantContext = Depends(tenant_context),
    session: AsyncSession = Depends(get_session),
) -> SettingsResponse:
    data = {k: v for k, v in payload.model_dump().items() if v is not None}
    if data:
        await repo.upsert_policy(session, ctx.tenant_id, **data)
        await repo.write_audit(
            session,
            tenant_id=ctx.tenant_id,
            action="settings.updated",
            actor="dashboard",
            resource_type="RemediationPolicy",
            resource_id=ctx.tenant_id,
            payload=data,
        )
        await session.commit()
    policy = await repo.get_policy(session, ctx.tenant_id)
    return _build_settings_response(get_ai_provider(), policy)


@router.post("/diagnose", response_model=DiagnoseResponse, summary="Diagnose a cluster incident")
async def diagnose_incident(
    payload: IncidentContext,
    ctx: TenantContext = Depends(tenant_context),
    session: AsyncSession = Depends(get_session),
) -> DiagnoseResponse:
    start = time.perf_counter()
    provider = get_ai_provider()
    bus = get_event_bus()

    # Create/refresh the incident as 'diagnosing' FIRST so the card appears
    # immediately, then stream the investigation + reasoning into it live.
    existing = await repo.find_open_incident_by_signature(
        session, ctx.tenant_id, payload.namespace, payload.kind, payload.name, payload.reason
    )
    if existing is not None:
        incident = existing
        incident.status = "diagnosing"
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
            summary="",
            root_cause="",
            confidence=0.0,
            evidence=[],
            remediation={},
            raw_context=payload.model_dump(),
            model_used=None,
        )
    await session.commit()
    await bus.publish(
        {
            "type": "incident.detected",
            "tenant_id": ctx.tenant_id,
            "incident": IncidentOut.model_validate(incident).model_dump(mode="json"),
        }
    )

    rca, model_used, provider_name = await k8s_rca.diagnose_streaming(
        provider, payload, tenant_id=ctx.tenant_id, incident_id=incident.id, bus=bus
    )

    # The tenant's RemediationPolicy governs whether this fix auto-applies.
    policy = await repo.get_policy(session, ctx.tenant_id)
    effective_mode = _effective_mode(
        policy,
        rca.remediation.mode,
        rca.remediation.risk,
        rca.remediation.action,
        payload.namespace,
        get_settings().remediation_default_mode,
    )
    rem_dump = rca.remediation.model_dump()
    rem_dump["mode"] = effective_mode

    incident.summary = rca.summary
    incident.root_cause = rca.root_cause
    incident.confidence = rca.confidence
    incident.evidence = rca.evidence
    incident.remediation = rem_dump
    incident.model_used = model_used

    rem = await repo.create_remediation(
        session,
        tenant_id=ctx.tenant_id,
        incident_id=incident.id,
        action=rca.remediation.action,
        target=rca.remediation.target,
        mode=effective_mode,
        status="proposed",
        rationale=rca.remediation.rationale,
        patch=rca.remediation.patch,
        risk=rca.remediation.risk,
    )

    incident.status = "remediating" if effective_mode == "auto" else "suggested"
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
    # A real in-cluster operator tags its snapshots source="operator"; the
    # simulator tags source="simulator". Report the truth to the dashboard.
    mode = "live" if (snap and (snap.detail or {}).get("source") == "operator") else "simulated"
    return OverviewResponse(
        stats=stats,
        snapshot=SnapshotOut.model_validate(snap) if snap else None,
        recent_incidents=[IncidentOut.model_validate(i) for i in incidents],
        recent_remediations=[RemediationOut.model_validate(r) for r in rems],
        mode=mode,
    )


@router.post("/ask", response_model=AskResponse, summary="Ask your cluster (NL Q&A over live state)")
async def ask_cluster_endpoint(
    payload: AskRequest,
    ctx: TenantContext = Depends(tenant_context),
    session: AsyncSession = Depends(get_session),
) -> AskResponse:
    provider = get_ai_provider()
    snap = await repo.latest_snapshot(session, ctx.tenant_id)
    incidents = await repo.list_incidents(session, ctx.tenant_id, limit=20)
    context = {
        "snapshot": SnapshotOut.model_validate(snap).model_dump(mode="json") if snap else None,
        "incidents": [
            {
                "namespace": i.namespace,
                "name": i.name,
                "reason": i.reason,
                "status": i.status,
                "severity": i.severity,
                "summary": i.summary,
            }
            for i in incidents
        ],
    }
    sources = [i.id for i in incidents[:5]]

    if getattr(provider, "name", "") == "offline":
        return AskResponse(
            answer=_offline_answer(context),
            sources=sources,
            model_used="deterministic",
            provider="deterministic",
        )
    try:
        result = await provider.generate(
            ask_cluster(payload.question, context),
            system=CLUSTER_ADVISOR_SYSTEM,
            temperature=0.3,
            max_tokens=600,
        )
        answer = (result.text or "").strip() or _offline_answer(context)
        return AskResponse(
            answer=answer,
            sources=sources,
            model_used=result.model_id,
            provider=result.provider,
        )
    except AIProviderError as exc:
        logger.warning("k8s.ask_failed", error=str(exc))
        return AskResponse(
            answer=_offline_answer(context),
            sources=sources,
            model_used="deterministic",
            provider="deterministic",
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
