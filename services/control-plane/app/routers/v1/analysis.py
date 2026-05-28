"""POST /v1/analysis — code analysis via Bedrock."""

from __future__ import annotations

import time
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, status

from app.deps import TenantContext, tenant_context
from app.schemas.analysis import AnalysisRequest, AnalysisResponse
from app.schemas.common import AnalysisMetadata, RiskScores, Severity, Violation
from app.services.ai import AIProviderError, get_ai_provider
from app.services.prompts import SYSTEM_PROMPT, analyse_code

router = APIRouter(prefix="/analysis", tags=["analysis"])


@router.post("", response_model=AnalysisResponse, summary="Analyse code for architectural risks")
async def analyse(
    payload: AnalysisRequest,
    ctx: TenantContext = Depends(tenant_context),
) -> AnalysisResponse:
    start = time.perf_counter()
    provider = get_ai_provider()

    prompt = analyse_code(code=payload.code, language=payload.language)
    try:
        result = await provider.generate(prompt, system=SYSTEM_PROMPT, temperature=0.2, json=True)
    except AIProviderError as exc:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"AI invocation failed: {exc}",
        ) from exc

    parsed = result.json_payload or {}
    elapsed_ms = (time.perf_counter() - start) * 1000.0

    return AnalysisResponse(
        summary=parsed.get("summary", "Analysis completed; raw model output preserved."),
        severity=parsed.get("severity", "info"),
        violations=[_coerce_violation(v) for v in parsed.get("violations", [])],
        risk_scores=_coerce_scores(parsed.get("risk_scores")),
        recommendations=list(parsed.get("recommendations", [])),
        metadata=AnalysisMetadata(
            request_id=ctx.request_id,
            tenant_id=ctx.tenant_id,
            model_used=result.model_id,
            latency_ms=round(elapsed_ms, 2),
            created_at=datetime.now(timezone.utc),
        ),
    )


def _coerce_violation(v: dict) -> Violation:
    return Violation(
        severity=Severity(v.get("severity", "info")),
        category=v.get("category", "uncategorised"),
        title=v.get("title", "Unnamed finding"),
        description=v.get("description", ""),
        file=v.get("file"),
        line_start=v.get("line_start"),
        line_end=v.get("line_end"),
        recommendation=v.get("recommendation"),
        auto_fix_available=bool(v.get("auto_fix_available", False)),
    )


def _coerce_scores(s: dict | None) -> RiskScores | None:
    if not s:
        return None
    try:
        return RiskScores(**{k: int(v) for k, v in s.items() if k in RiskScores.model_fields})
    except (TypeError, ValueError):
        return None
