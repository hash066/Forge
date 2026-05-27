"""POST /v1/auth — session lookup + Clerk webhook (Phase 1 expansion)."""

from __future__ import annotations

from fastapi import APIRouter, Depends

from app.deps import TenantContext, tenant_context
from app.schemas.common import StrictModel

router = APIRouter(prefix="/auth", tags=["auth"])


class SessionResponse(StrictModel):
    tenant_id: str
    user_id: str | None
    mode: str = "developer"


@router.get("/session", response_model=SessionResponse, summary="Resolve current session")
async def session(ctx: TenantContext = Depends(tenant_context)) -> SessionResponse:
    """
    Returns the tenant + user resolved from the current credentials.
    Used by the extension after login to confirm token + cache identity.
    """
    return SessionResponse(tenant_id=ctx.tenant_id, user_id=ctx.user_id)


@router.get("/ready", summary="Readiness — verifies downstreams")
async def ready() -> dict[str, str]:
    """
    Deep health check. Phase 1: pings Bedrock + DB + Redis.
    For now: returns ok if process is up (same as /health).
    """
    return {"status": "ok"}
