"""
Thin async repository over the DevForge OS tables.

Keeps routers free of SQLAlchemy boilerplate and centralises tenant-scoped
queries (every read filters by ``tenant_id`` — application-level isolation
today; Postgres RLS slots in here later without touching call sites).
"""

from __future__ import annotations

from datetime import datetime, timezone
from typing import Any

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models import AuditLog, ClusterSnapshot, Incident, Remediation, RemediationPolicy


# ── Incidents ────────────────────────────────────────────────────────────────
async def create_incident(session: AsyncSession, **fields: Any) -> Incident:
    incident = Incident(**fields)
    session.add(incident)
    await session.flush()
    return incident


async def get_incident(session: AsyncSession, tenant_id: str, incident_id: str) -> Incident | None:
    result = await session.execute(
        select(Incident).where(Incident.tenant_id == tenant_id, Incident.id == incident_id)
    )
    return result.scalar_one_or_none()


async def find_open_incident_by_signature(
    session: AsyncSession, tenant_id: str, namespace: str, kind: str, name: str, reason: str
) -> Incident | None:
    result = await session.execute(
        select(Incident).where(
            Incident.tenant_id == tenant_id,
            Incident.namespace == namespace,
            Incident.kind == kind,
            Incident.name == name,
            Incident.reason == reason,
            Incident.status != "resolved",
        )
    )
    return result.scalars().first()


async def list_incidents(
    session: AsyncSession, tenant_id: str, *, limit: int = 100, status: str | None = None
) -> list[Incident]:
    stmt = select(Incident).where(Incident.tenant_id == tenant_id)
    if status:
        stmt = stmt.where(Incident.status == status)
    stmt = stmt.order_by(Incident.detected_at.desc()).limit(limit)
    result = await session.execute(stmt)
    return list(result.scalars().all())


async def resolve_incident(session: AsyncSession, incident: Incident) -> None:
    incident.status = "resolved"
    incident.resolved_at = datetime.now(timezone.utc)
    await session.flush()


# ── Remediations ──────────────────────────────────────────────────────────────
async def create_remediation(session: AsyncSession, **fields: Any) -> Remediation:
    rem = Remediation(**fields)
    session.add(rem)
    await session.flush()
    return rem


async def list_remediations(
    session: AsyncSession, tenant_id: str, *, limit: int = 100
) -> list[Remediation]:
    result = await session.execute(
        select(Remediation)
        .where(Remediation.tenant_id == tenant_id)
        .order_by(Remediation.created_at.desc())
        .limit(limit)
    )
    return list(result.scalars().all())


# ── Snapshots ─────────────────────────────────────────────────────────────────
async def create_snapshot(session: AsyncSession, **fields: Any) -> ClusterSnapshot:
    snap = ClusterSnapshot(**fields)
    session.add(snap)
    await session.flush()
    return snap


async def latest_snapshot(
    session: AsyncSession, tenant_id: str, cluster: str | None = None
) -> ClusterSnapshot | None:
    stmt = select(ClusterSnapshot).where(ClusterSnapshot.tenant_id == tenant_id)
    if cluster:
        stmt = stmt.where(ClusterSnapshot.cluster == cluster)
    stmt = stmt.order_by(ClusterSnapshot.created_at.desc()).limit(1)
    result = await session.execute(stmt)
    return result.scalar_one_or_none()


# ── Remediation policy (Settings) ──────────────────────────────────────────────
async def get_policy(session: AsyncSession, tenant_id: str) -> RemediationPolicy | None:
    return await session.get(RemediationPolicy, tenant_id)


async def upsert_policy(session: AsyncSession, tenant_id: str, **fields: Any) -> RemediationPolicy:
    policy = await session.get(RemediationPolicy, tenant_id)
    if policy is None:
        policy = RemediationPolicy(tenant_id=tenant_id, **fields)
        session.add(policy)
    else:
        for key, value in fields.items():
            setattr(policy, key, value)
    await session.flush()
    return policy


# ── Audit ─────────────────────────────────────────────────────────────────────
async def write_audit(
    session: AsyncSession,
    *,
    tenant_id: str,
    action: str,
    actor: str = "system",
    resource_type: str = "",
    resource_id: str = "",
    payload: dict[str, Any] | None = None,
) -> AuditLog:
    entry = AuditLog(
        tenant_id=tenant_id,
        action=action,
        actor=actor,
        resource_type=resource_type,
        resource_id=resource_id,
        payload=payload or {},
    )
    session.add(entry)
    await session.flush()
    return entry


async def list_audit(session: AsyncSession, tenant_id: str, *, limit: int = 100) -> list[AuditLog]:
    result = await session.execute(
        select(AuditLog)
        .where(AuditLog.tenant_id == tenant_id)
        .order_by(AuditLog.created_at.desc())
        .limit(limit)
    )
    return list(result.scalars().all())


# ── Aggregates (dashboard overview) ───────────────────────────────────────────
async def incident_stats(session: AsyncSession, tenant_id: str) -> dict[str, int]:
    result = await session.execute(
        select(Incident.status, func.count())
        .where(Incident.tenant_id == tenant_id)
        .group_by(Incident.status)
    )
    by_status = {row[0]: int(row[1]) for row in result.all()}
    total = sum(by_status.values())
    return {
        "total": total,
        "open": total - by_status.get("resolved", 0),
        "resolved": by_status.get("resolved", 0),
        "detected": by_status.get("detected", 0),
        "remediating": by_status.get("remediating", 0),
        "suggested": by_status.get("suggested", 0),
    }
