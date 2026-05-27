"""POST /v1/mentor — chat with the AI mentor."""

from __future__ import annotations

import time
from datetime import datetime, timezone
from typing import Literal

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import Field

from app.deps import TenantContext, tenant_context
from app.schemas.common import AnalysisMetadata, StrictModel
from app.services.bedrock import BedrockError, get_bedrock_client
from app.services.prompts import mentor_chat

router = APIRouter(prefix="/mentor", tags=["mentor"])


class MentorMessage(StrictModel):
    role: Literal["user", "assistant"]
    content: str = Field(..., max_length=8000)


class MentorRequest(StrictModel):
    question: str = Field(..., max_length=8000)
    mode: Literal["student", "developer"] = "developer"
    code_context: str | None = Field(default=None, max_length=8000)
    history: list[MentorMessage] = Field(default_factory=list, max_length=20)


class MentorResponse(StrictModel):
    response: str
    metadata: AnalysisMetadata


@router.post("/chat", response_model=MentorResponse, summary="Mentor chat — Socratic or direct")
async def chat(
    payload: MentorRequest,
    ctx: TenantContext = Depends(tenant_context),
) -> MentorResponse:
    start = time.perf_counter()
    bedrock = get_bedrock_client()
    history_block = "\n".join(f"{m.role.upper()}: {m.content}" for m in payload.history[-10:])
    full_question = (
        f"{history_block}\n\nUSER: {payload.question}" if history_block else payload.question
    )
    context_dict = {"code": payload.code_context} if payload.code_context else None
    prompt = mentor_chat(question=full_question, mode=payload.mode, context=context_dict)
    try:
        # Higher temperature for chat — we want personality
        result = await bedrock.invoke(prompt, temperature=0.6, max_tokens=1500)
    except BedrockError as exc:
        raise HTTPException(status.HTTP_502_BAD_GATEWAY, detail=str(exc)) from exc
    return MentorResponse(
        response=result.text,
        metadata=AnalysisMetadata(
            request_id=ctx.request_id,
            tenant_id=ctx.tenant_id,
            model_used=result.model_id,
            latency_ms=round((time.perf_counter() - start) * 1000.0, 2),
            created_at=datetime.now(timezone.utc),
        ),
    )
