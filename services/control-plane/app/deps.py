"""
Common FastAPI dependencies.

`tenant_context` is the workhorse — every authenticated endpoint depends on it
to get the current tenant + user id without re-parsing the request.
"""

from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime, timezone

from fastapi import Depends, Header, HTTPException, Request, status

from app.config import Settings, get_settings


@dataclass(frozen=True, slots=True)
class TenantContext:
    """Resolved per-request context. Cheap to copy, safe to log."""

    tenant_id: str
    user_id: str | None
    request_id: str
    now: datetime


async def tenant_context(request: Request) -> TenantContext:
    tenant_id = getattr(request.state, "tenant_id", None)
    if not tenant_id:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="No tenant context")
    return TenantContext(
        tenant_id=tenant_id,
        user_id=getattr(request.state, "user_id", None),
        request_id=getattr(request.state, "request_id", "unknown"),
        now=datetime.now(timezone.utc),
    )


async def require_internal_api_key(
    x_api_key: str | None = Header(default=None, alias="X-API-Key"),
    settings: Settings = Depends(get_settings),
) -> None:
    """
    Guard for routes accessible only with the internal API key (CLI, CI/CD agent).
    Phase 4: replace with scoped keys per tenant stored in the `api_keys` table.
    """
    if not x_api_key or x_api_key != settings.internal_api_key:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or missing API key",
        )
