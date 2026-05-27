"""POST /v1/quiz — comprehension quiz for Student mode."""

from __future__ import annotations

import time
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import Field

from app.deps import TenantContext, tenant_context
from app.schemas.common import AnalysisMetadata, Language, StrictModel
from app.services.bedrock import BedrockError, get_bedrock_client
from app.services.prompts import SYSTEM_PROMPT, generate_quiz

router = APIRouter(prefix="/quiz", tags=["student"])


class QuizRequest(StrictModel):
    code: str = Field(..., min_length=1, max_length=10_000)
    language: Language = "javascript"


class QuizResponse(StrictModel):
    question: str
    options: list[str]
    correct_index: int
    explanation: str
    difficulty: str
    skill_dimension: str
    metadata: AnalysisMetadata


@router.post("/generate", response_model=QuizResponse, summary="Generate a comprehension quiz")
async def generate(
    payload: QuizRequest,
    ctx: TenantContext = Depends(tenant_context),
) -> QuizResponse:
    start = time.perf_counter()
    bedrock = get_bedrock_client()
    prompt = generate_quiz(payload.code, payload.language)
    try:
        result = await bedrock.invoke(prompt, system=SYSTEM_PROMPT, temperature=0.5, max_tokens=1000)
    except BedrockError as exc:
        raise HTTPException(status.HTTP_502_BAD_GATEWAY, detail=str(exc)) from exc
    parsed = result.json_payload or {}
    return QuizResponse(
        question=parsed.get("question", "What does this code do?"),
        options=list(parsed.get("options", ["A", "B", "C", "D"]))[:4],
        correct_index=int(parsed.get("correct_index", 0)),
        explanation=parsed.get("explanation", ""),
        difficulty=parsed.get("difficulty", "medium"),
        skill_dimension=parsed.get("skill_dimension", "system_design"),
        metadata=AnalysisMetadata(
            request_id=ctx.request_id,
            tenant_id=ctx.tenant_id,
            model_used=result.model_id,
            latency_ms=round((time.perf_counter() - start) * 1000.0, 2),
            created_at=datetime.now(timezone.utc),
        ),
    )
