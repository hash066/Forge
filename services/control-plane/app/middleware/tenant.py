"""
Tenant context middleware.

Every authenticated request resolves to exactly one tenant. The tenant id is
extracted from the Clerk JWT (`org_id` claim) or, for service-to-service / CLI
traffic, from the `X-Tenant-Id` header alongside the internal API key.

We bind the resolved id to `request.state.tenant_id` so downstream dependencies
(DB session, Redis cache keys) can read it without re-parsing the token.

For unauthenticated routes (/, /health, /docs) tenant resolution is skipped.
"""

from __future__ import annotations

import uuid
from collections.abc import Awaitable, Callable

import structlog
from fastapi import Request, Response
from starlette.middleware.base import BaseHTTPMiddleware

logger = structlog.get_logger(__name__)

_PUBLIC_PATHS: frozenset[str] = frozenset({"/", "/health", "/docs", "/redoc", "/openapi.json"})


class TenantContextMiddleware(BaseHTTPMiddleware):
    async def dispatch(
        self,
        request: Request,
        call_next: Callable[[Request], Awaitable[Response]],
    ) -> Response:
        # Attach a request id for tracing — surfaces in audit log + response header
        request.state.request_id = str(uuid.uuid4())

        # Public routes — no tenant required
        if request.url.path in _PUBLIC_PATHS:
            response = await call_next(request)
            response.headers["X-Request-Id"] = request.state.request_id
            return response

        # Tenant resolution happens here in Phase 1 when we wire Clerk JWT decoding.
        # For now: accept X-Tenant-Id header (CLI flow) or anonymous (dev).
        tenant_id = request.headers.get("X-Tenant-Id") or "anonymous"
        request.state.tenant_id = tenant_id
        request.state.user_id = request.headers.get("X-User-Id")

        response = await call_next(request)
        response.headers["X-Request-Id"] = request.state.request_id
        return response
