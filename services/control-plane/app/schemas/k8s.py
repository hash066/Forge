"""
Pydantic schemas for the DevForge OS Kubernetes surface.

Inbound payloads from the operator use ``FlexModel`` (extra fields ignored) so a
newer operator can send richer context without breaking an older control plane.
Outbound/response payloads use strict shapes the dashboard + CLI can rely on.
"""

from __future__ import annotations

from datetime import datetime
from typing import Any, Literal

from pydantic import BaseModel, ConfigDict, Field

IncidentReason = Literal[
    "CrashLoopBackOff",
    "OOMKilled",
    "ImagePullBackOff",
    "ErrImagePull",
    "ProbeFailure",
    "StuckRollout",
    "Unschedulable",
    "MissingLimits",
    "OverProvisioned",
    "PrivilegedPod",
    "HighRestarts",
    "Unknown",
]

RemediationAction = Literal[
    "restart_pod",
    "rollback",
    "set_resources",
    "scale",
    "patch_image",
    "adjust_probe",
    "add_limits",
    "cordon_drain",
    "none",
]

RiskLevel = Literal["low", "medium", "high"]
RemediationMode = Literal["auto", "suggest"]


class FlexModel(BaseModel):
    """Inbound base — tolerant of unknown fields from future operator versions."""

    model_config = ConfigDict(extra="ignore", populate_by_name=True)


class OutModel(BaseModel):
    """Outbound base — reads straight from ORM objects."""

    model_config = ConfigDict(from_attributes=True)


# ── Inbound ───────────────────────────────────────────────────────────────────
class IncidentContext(FlexModel):
    cluster: str = "default"
    namespace: str = "default"
    kind: str = "Pod"
    name: str
    reason: str = "Unknown"
    severity: str = "high"
    message: str = ""
    events: list[str] = Field(default_factory=list)
    logs: str | None = None
    container_statuses: list[dict[str, Any]] = Field(default_factory=list)
    spec_excerpt: dict[str, Any] = Field(default_factory=dict)
    metrics: dict[str, Any] = Field(default_factory=dict)


class RemediateReport(FlexModel):
    incident_id: str
    remediation_id: str | None = None
    action: str = "none"
    target: str = ""
    status: Literal["applied", "failed", "skipped", "approved", "proposed"] = "applied"
    detail: str | None = None


class ClusterSnapshotIn(FlexModel):
    cluster: str = "default"
    nodes: int = 0
    pods_total: int = 0
    pods_healthy: int = 0
    namespaces: int = 0
    health_score: float = 100.0
    monthly_cost_usd: float = 0.0
    monthly_waste_usd: float = 0.0
    security_findings: int = 0
    detail: dict[str, Any] = Field(default_factory=dict)


# ── RCA / remediation ───────────────────────────────────────────────────────────
class RemediationPlan(BaseModel):
    action: str = "none"
    target: str = ""
    rationale: str = ""
    patch: dict[str, Any] = Field(default_factory=dict)
    risk: RiskLevel = "low"
    mode: RemediationMode = "suggest"
    commands: list[str] = Field(default_factory=list)


class RCA(BaseModel):
    root_cause: str
    summary: str
    confidence: float = 0.0
    category: str = "reliability"
    evidence: list[str] = Field(default_factory=list)
    remediation: RemediationPlan


# ── Responses ────────────────────────────────────────────────────────────────
class DiagnoseResponse(BaseModel):
    incident_id: str
    remediation_id: str = ""
    status: str
    rca: RCA
    model_used: str | None = None
    provider: str = ""
    latency_ms: float = 0.0
    cached: bool = False


class IncidentOut(OutModel):
    id: str
    tenant_id: str
    cluster: str
    namespace: str
    kind: str
    name: str
    reason: str
    severity: str
    status: str
    summary: str
    root_cause: str
    confidence: float
    evidence: list[Any]
    remediation: dict[str, Any]
    model_used: str | None
    detected_at: datetime
    resolved_at: datetime | None
    created_at: datetime


class RemediationOut(OutModel):
    id: str
    tenant_id: str
    incident_id: str
    action: str
    target: str
    mode: str
    status: str
    rationale: str
    patch: dict[str, Any]
    risk: str
    applied_at: datetime | None
    created_at: datetime


class SnapshotOut(OutModel):
    id: str
    cluster: str
    nodes: int
    pods_total: int
    pods_healthy: int
    namespaces: int
    health_score: float
    monthly_cost_usd: float
    monthly_waste_usd: float
    security_findings: int
    detail: dict[str, Any]
    created_at: datetime


class AuditOut(OutModel):
    id: str
    actor: str
    action: str
    resource_type: str
    resource_id: str
    payload: dict[str, Any]
    created_at: datetime


class OverviewResponse(BaseModel):
    stats: dict[str, int]
    snapshot: SnapshotOut | None = None
    recent_incidents: list[IncidentOut] = Field(default_factory=list)
    recent_remediations: list[RemediationOut] = Field(default_factory=list)
    # "live" when a real in-cluster operator is reporting; "simulated" otherwise.
    mode: str = "simulated"


class OkResponse(BaseModel):
    ok: bool = True
    detail: str = ""
