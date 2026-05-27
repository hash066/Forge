"""POST /v1/risk — multi-dimensional risk scoring."""

from __future__ import annotations

import time
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, status

from app.deps import TenantContext, tenant_context
from app.schemas.analysis import RiskRequest, RiskResponse
from app.schemas.common import AnalysisMetadata, RiskScores
from app.services.bedrock import BedrockError, get_bedrock_client
from app.services.prompts import SYSTEM_PROMPT, calculate_risk

router = APIRouter(prefix="/risk", tags=["analysis"])


@router.post("", response_model=RiskResponse, summary="Score architecture across four dimensions")
async def score(
    payload: RiskRequest,
    ctx: TenantContext = Depends(tenant_context),
) -> RiskResponse:
    start = time.perf_counter()
    bedrock = get_bedrock_client()
    prompt = calculate_risk(architecture=payload.architecture, context=payload.context)
    try:
        result = await bedrock.invoke(prompt, system=SYSTEM_PROMPT, temperature=0.1)
    except BedrockError as exc:
        raise HTTPException(status.HTTP_502_BAD_GATEWAY, detail=str(exc)) from exc

    parsed = result.json_payload or {}
    raw_scores = parsed.get("scores", {})
    scores = RiskScores(
        scalability=int(raw_scores.get("scalability", 0)),
        over_engineering=int(raw_scores.get("over_engineering", 0)),
        security=int(raw_scores.get("security", 0)),
        consistency=int(raw_scores.get("consistency", 0)),
    )
    return RiskResponse(
        scores=scores,
        rationale=dict(parsed.get("rationale", {})),
        metadata=AnalysisMetadata(
            request_id=ctx.request_id,
            tenant_id=ctx.tenant_id,
            model_used=result.model_id,
            latency_ms=round((time.perf_counter() - start) * 1000.0, 2),
            created_at=datetime.now(timezone.utc),
        ),
    )
