"""POST /v1/drift — architecture drift detection."""

from __future__ import annotations

import time
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, status

from app.deps import TenantContext, tenant_context
from app.schemas.analysis import DriftItem, DriftRequest, DriftResponse
from app.schemas.common import AnalysisMetadata
from app.services.ai import AIProviderError, get_ai_provider
from app.services.prompts import SYSTEM_PROMPT, detect_drift

router = APIRouter(prefix="/drift", tags=["analysis"])


@router.post("", response_model=DriftResponse, summary="Detect drift between blueprint and code")
async def check_drift(
    payload: DriftRequest,
    ctx: TenantContext = Depends(tenant_context),
) -> DriftResponse:
    start = time.perf_counter()
    provider = get_ai_provider()
    # Phase 1: pull blueprint from DB by id. For now we send what the caller provided.
    blueprint = {"id": payload.blueprint_id, "actual_resources": payload.actual_resources}
    prompt = detect_drift(blueprint=blueprint, actual_code=payload.code or "")
    try:
        result = await provider.generate(prompt, system=SYSTEM_PROMPT, temperature=0.1, json=True)
    except AIProviderError as exc:
        raise HTTPException(status.HTTP_502_BAD_GATEWAY, detail=str(exc)) from exc

    parsed = result.json_payload or {}
    items = [DriftItem(**i) for i in parsed.get("items", [])]
    return DriftResponse(
        drift_detected=bool(parsed.get("drift_detected", False)),
        drift_score=int(parsed.get("drift_score", 0)),
        items=items,
        metadata=AnalysisMetadata(
            request_id=ctx.request_id,
            tenant_id=ctx.tenant_id,
            model_used=result.model_id,
            latency_ms=round((time.perf_counter() - start) * 1000.0, 2),
            created_at=datetime.now(timezone.utc),
        ),
    )
