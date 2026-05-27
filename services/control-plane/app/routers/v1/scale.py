"""
POST /v1/scale — scale collapse predictor.

Deterministic capacity model. Each component has a known concurrency ceiling;
the timeline finds the first ceiling crossed as users scale.
"""

from __future__ import annotations

import time
from datetime import datetime, timezone
from typing import Literal

from fastapi import APIRouter, Depends
from pydantic import Field

from app.deps import TenantContext, tenant_context
from app.schemas.common import AnalysisMetadata, StrictModel

router = APIRouter(prefix="/scale", tags=["analysis"])


# Approximate concurrent-user capacity per instance class. Conservative.
_DB_CAPACITY = {
    "db.t3.micro": 1_000,
    "db.t3.small": 5_000,
    "db.t3.medium": 10_000,
    "db.t3.large": 25_000,
    "db.r6g.large": 50_000,
    "db.r6g.xlarge": 100_000,
}

_COMPUTE_CAPACITY = {
    "t3.micro": 500,
    "t3.small": 2_000,
    "t3.medium": 5_000,
    "t3.large": 10_000,
    "t3.xlarge": 25_000,
    "fargate:0.25vcpu": 1_000,
    "fargate:0.5vcpu": 2_500,
    "fargate:1vcpu": 6_000,
}


class ScaleArch(StrictModel):
    database: dict = {}
    compute: dict = {}
    cache: dict = {}


class ScaleRequest(StrictModel):
    architecture: ScaleArch
    current_users: int = Field(default=0, ge=0)


class TimelineEvent(StrictModel):
    user_count: int
    status: Literal["healthy", "degraded", "critical", "failure"]
    health_score: int
    component: str | None = None
    description: str
    recommendation: str | None = None
    cost_delta_monthly: float | None = None


class ScaleResponse(StrictModel):
    current_users: int
    timeline: list[TimelineEvent]
    first_failure_at: int | None
    summary: str
    metadata: AnalysisMetadata


@router.post("/predict", response_model=ScaleResponse, summary="Predict where the system breaks")
async def predict(
    payload: ScaleRequest,
    ctx: TenantContext = Depends(tenant_context),
) -> ScaleResponse:
    start = time.perf_counter()
    db_class = payload.architecture.database.get("instance_class", "db.t3.micro")
    compute_class = payload.architecture.compute.get("instance_type", "t3.small")

    db_cap = _DB_CAPACITY.get(db_class, 1_000)
    compute_cap = _COMPUTE_CAPACITY.get(compute_class, 500)

    events: list[TimelineEvent] = [
        TimelineEvent(
            user_count=payload.current_users,
            status="healthy",
            health_score=100,
            description="Current load — all systems within nominal capacity.",
        ),
        TimelineEvent(
            user_count=int(min(db_cap, compute_cap) * 0.8),
            status="degraded",
            health_score=60,
            component="database" if db_cap <= compute_cap else "compute",
            description="Capacity approaching limit; latency starts rising.",
            recommendation="Add read replica or right-size up one tier.",
            cost_delta_monthly=50.0,
        ),
        TimelineEvent(
            user_count=db_cap,
            status="critical",
            health_score=20,
            component="database",
            description=f"Database connection pool exhausted at ~{db_cap:,} users.",
            recommendation="Scale RDS to next class or shard.",
            cost_delta_monthly=120.0,
        ),
        TimelineEvent(
            user_count=compute_cap,
            status="failure",
            health_score=0,
            component="compute",
            description="Compute layer saturated — sustained 5xx errors.",
            recommendation="Enable horizontal autoscaling.",
            cost_delta_monthly=80.0,
        ),
    ]
    events.sort(key=lambda e: e.user_count)
    first_failure = next((e.user_count for e in events if e.status in {"critical", "failure"}), None)
    summary = (
        f"System remains healthy through ~{int(min(db_cap, compute_cap) * 0.8):,} users; "
        f"first failure expected near {first_failure:,} users." if first_failure else "Stable."
    )
    return ScaleResponse(
        current_users=payload.current_users,
        timeline=events,
        first_failure_at=first_failure,
        summary=summary,
        metadata=AnalysisMetadata(
            request_id=ctx.request_id,
            tenant_id=ctx.tenant_id,
            latency_ms=round((time.perf_counter() - start) * 1000.0, 2),
            created_at=datetime.now(timezone.utc),
        ),
    )
