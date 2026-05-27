"""
POST /v1/cost — AWS cost estimation.

Phase 0: heuristic per-service pricing table. Phase 1: AWS Price List API
with Redis caching keyed by `service:region:config_hash`.
"""

from __future__ import annotations

import time
from datetime import datetime, timezone

from fastapi import APIRouter, Depends

from app.deps import TenantContext, tenant_context
from app.schemas.common import AnalysisMetadata, StrictModel

router = APIRouter(prefix="/cost", tags=["cost"])


class CostResource(StrictModel):
    type: str  # ec2 | rds | lambda | s3 | dynamodb | elasticache | ...
    configuration: dict = {}


class CostRequest(StrictModel):
    resources: list[CostResource]
    region: str = "eu-north-1"


class ServiceEstimate(StrictModel):
    type: str
    monthly_cost: float
    breakdown: dict[str, float] = {}


class CostResponse(StrictModel):
    region: str
    monthly_total: float
    daily_total: float
    annual_total: float
    estimates: list[ServiceEstimate]
    metadata: AnalysisMetadata


# Phase 0 pricing table — order-of-magnitude correct. Replace with Price List API.
_PRICING: dict[str, float] = {
    "ec2:t3.micro": 7.59,
    "ec2:t3.small": 15.18,
    "ec2:t3.medium": 30.37,
    "ec2:t3.large": 60.74,
    "rds:db.t3.micro": 12.41,
    "rds:db.t3.small": 24.82,
    "rds:db.t3.medium": 49.64,
    "rds:db.r6g.large": 173.0,
    "rds:db.r6g.xlarge": 346.0,
    "lambda:default": 1.50,
    "s3:standard": 0.023,  # per GB
    "elasticache:cache.t3.micro": 12.41,
    "elasticache:cache.t3.small": 24.82,
    "dynamodb:on-demand": 5.00,
    "apigateway:rest": 3.50,
    "fargate:default": 22.13,
}


@router.post("", response_model=CostResponse, summary="Estimate monthly AWS cost")
async def estimate(
    payload: CostRequest,
    ctx: TenantContext = Depends(tenant_context),
) -> CostResponse:
    start = time.perf_counter()
    estimates: list[ServiceEstimate] = []
    for r in payload.resources:
        # Per-resource lookup. S3 prices per GB·month, everything else per-instance.
        if r.type == "s3":
            unit = _PRICING.get("s3:standard", 0.023)
            gb = float(r.configuration.get("storage_gb", 100))
            monthly = unit * gb
            breakdown = {"storage_gb_month": monthly}
        else:
            size_key = (
                r.configuration.get("instance_class")
                or r.configuration.get("instance_type")
                or "default"
            )
            key = f"{r.type}:{size_key}"
            unit = _PRICING.get(key) or _PRICING.get(f"{r.type}:default", 0.0)
            monthly = unit
            breakdown = {"compute": monthly}
        estimates.append(ServiceEstimate(type=r.type, monthly_cost=monthly, breakdown=breakdown))

    total = sum(e.monthly_cost for e in estimates)
    return CostResponse(
        region=payload.region,
        monthly_total=round(total, 2),
        daily_total=round(total / 30.0, 2),
        annual_total=round(total * 12.0, 2),
        estimates=estimates,
        metadata=AnalysisMetadata(
            request_id=ctx.request_id,
            tenant_id=ctx.tenant_id,
            latency_ms=round((time.perf_counter() - start) * 1000.0, 2),
            created_at=datetime.now(timezone.utc),
        ),
    )
