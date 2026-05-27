"""FastAPI app entry point. Boots middleware, routers, and lifecycle hooks."""

from __future__ import annotations

import logging
from collections.abc import AsyncIterator
from contextlib import asynccontextmanager

import structlog
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app import __version__
from app.config import get_settings
from app.middleware.audit import AuditMiddleware
from app.middleware.tenant import TenantContextMiddleware
from app.routers import health
from app.routers.v1 import (
    analysis,
    auth,
    blueprints,
    cost,
    diagnose,
    drift,
    mentor,
    patterns,
    quiz,
    risk,
    scale,
    security,
)

logger = structlog.get_logger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncIterator[None]:
    """
    Application lifespan — wire shared clients here. Bedrock + Redis are lazy,
    so this is mostly logging right now; in Phase 1 we add DB pool warmup,
    pre-fetch of prompt registry from S3, etc.
    """
    settings = get_settings()
    logging.basicConfig(level=settings.log_level)
    logger.info(
        "control_plane.boot",
        version=__version__,
        env=settings.app_env,
        region=settings.aws_region,
        model=settings.aws_bedrock_model_id,
    )
    yield
    logger.info("control_plane.shutdown")


def create_app() -> FastAPI:
    settings = get_settings()

    app = FastAPI(
        title="DevForge Control Plane",
        description=(
            "The AI brain for DevForge. Handles architecture analysis, drift detection, "
            "risk scoring, cost estimation, security scanning, mentor chat, and CLI diagnosis. "
            "Multi-tenant from line one — every request is tenant-scoped."
        ),
        version=__version__,
        lifespan=lifespan,
        docs_url="/docs" if not settings.is_production else None,
        redoc_url="/redoc" if not settings.is_production else None,
        openapi_url="/openapi.json" if not settings.is_production else None,
    )

    # ── Middleware (order matters — last added runs first on request) ─────
    app.add_middleware(AuditMiddleware)
    app.add_middleware(TenantContextMiddleware)
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.origins_list,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*", "X-API-Key", "X-Tenant-Id", "Authorization"],
        expose_headers=["X-Request-Id"],
    )

    # ── Routers ────────────────────────────────────────────────────────────
    app.include_router(health.router)

    v1_routers = [
        auth.router,
        blueprints.router,
        analysis.router,
        drift.router,
        risk.router,
        cost.router,
        mentor.router,
        quiz.router,
        scale.router,
        security.router,
        patterns.router,
        diagnose.router,
    ]
    for router in v1_routers:
        app.include_router(router, prefix="/v1")

    @app.get("/", include_in_schema=False)
    async def root() -> dict[str, str]:
        return {
            "service": "devforge-control-plane",
            "version": __version__,
            "docs": "/docs" if not settings.is_production else "disabled",
        }

    return app


app = create_app()


if __name__ == "__main__":
    import uvicorn

    settings = get_settings()
    uvicorn.run("app.main:app", host=settings.host, port=settings.port, reload=settings.debug)
