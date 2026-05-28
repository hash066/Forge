"""
POST /v1/diagnose — CLI `devforge wtf` endpoint.

This is the route the Rust CLI hits. Carried forward (refactored) from the
original `backend/routers/diagnose.py`. Accepts git context + stack trace,
returns a structured diagnosis.
"""

from __future__ import annotations

import time
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import Field

from app.deps import TenantContext, require_internal_api_key, tenant_context
from app.schemas.common import AnalysisMetadata, StrictModel
from app.services.ai import AIProviderError, get_ai_provider
from app.services.prompts import SYSTEM_PROMPT, diagnose_failure

router = APIRouter(prefix="/diagnose", tags=["cli"])


class DiagnoseRequest(StrictModel):
    git_log: str = Field(..., max_length=20_000)
    git_diff: str = Field(default="", max_length=50_000)
    stack_trace: str | None = Field(default=None, max_length=20_000)
    logs: str | None = Field(default=None, max_length=20_000)


class DiagnoseResponse(StrictModel):
    diagnosis: str
    root_cause: str
    suggested_fix: str
    commands: list[str] = []
    confidence: float
    metadata: AnalysisMetadata


@router.post(
    "",
    response_model=DiagnoseResponse,
    dependencies=[Depends(require_internal_api_key)],
    summary="Diagnose a failing build/runtime — used by `devforge wtf`",
)
async def diagnose(
    payload: DiagnoseRequest,
    ctx: TenantContext = Depends(tenant_context),
) -> DiagnoseResponse:
    start = time.perf_counter()
    provider = get_ai_provider()
    prompt = diagnose_failure(payload.git_log, payload.git_diff, payload.stack_trace, payload.logs)
    try:
        result = await provider.generate(prompt, system=SYSTEM_PROMPT, temperature=0.2, json=True)
    except AIProviderError as exc:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"AI invocation failed: {exc}",
        ) from exc
    parsed = result.json_payload or {}
    return DiagnoseResponse(
        diagnosis=parsed.get("diagnosis", result.text[:400]),
        root_cause=parsed.get("root_cause", "Unknown — model did not return structured output."),
        suggested_fix=parsed.get("suggested_fix", ""),
        commands=list(parsed.get("commands", [])),
        confidence=float(parsed.get("confidence", 0.5)),
        metadata=AnalysisMetadata(
            request_id=ctx.request_id,
            tenant_id=ctx.tenant_id,
            model_used=result.model_id,
            latency_ms=round((time.perf_counter() - start) * 1000.0, 2),
            created_at=datetime.now(timezone.utc),
        ),
    )
