"""
Audit middleware — logs every mutating request to structured logs.

In Phase 4 we persist these to the `audit_log` table for the compliance UI.
For now: structured stdout via structlog, which CloudWatch ingests directly.
"""

from __future__ import annotations

import time
from collections.abc import Awaitable, Callable

import structlog
from fastapi import Request, Response
from starlette.middleware.base import BaseHTTPMiddleware

logger = structlog.get_logger("audit")

_MUTATING_METHODS = frozenset({"POST", "PUT", "PATCH", "DELETE"})


class AuditMiddleware(BaseHTTPMiddleware):
    async def dispatch(
        self,
        request: Request,
        call_next: Callable[[Request], Awaitable[Response]],
    ) -> Response:
        start = time.perf_counter()
        response = await call_next(request)
        elapsed_ms = (time.perf_counter() - start) * 1000.0

        # Only log mutations + errors. GETs flood the log and aren't useful here.
        should_log = request.method in _MUTATING_METHODS or response.status_code >= 400
        if should_log:
            logger.info(
                "request",
                method=request.method,
                path=request.url.path,
                status=response.status_code,
                elapsed_ms=round(elapsed_ms, 2),
                tenant_id=getattr(request.state, "tenant_id", None),
                user_id=getattr(request.state, "user_id", None),
                request_id=getattr(request.state, "request_id", None),
            )
        return response
