"""
Async database session management.

Defaults to a zero-setup SQLite file (perfect for the local demo); set
``DATABASE_URL`` to a Postgres DSN for production. URLs are normalised to their
async drivers automatically so callers can paste a plain ``postgresql://`` or
``sqlite://`` string and it just works.
"""

from __future__ import annotations

from collections.abc import AsyncIterator

import structlog
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

from app.config import get_settings
from app.models import Base

logger = structlog.get_logger(__name__)


def _normalize_async_url(url: str | None) -> str:
    if not url:
        return "sqlite+aiosqlite:///./devforge.db"
    if url.startswith("postgresql+") or url.startswith("sqlite+"):
        return url
    if url.startswith("postgresql://"):
        return url.replace("postgresql://", "postgresql+asyncpg://", 1)
    if url.startswith("postgres://"):
        return url.replace("postgres://", "postgresql+asyncpg://", 1)
    if url.startswith("sqlite://"):
        return url.replace("sqlite://", "sqlite+aiosqlite://", 1)
    return url


DATABASE_URL = _normalize_async_url(get_settings().database_url)

engine = create_async_engine(DATABASE_URL, echo=False, future=True, pool_pre_ping=True)
SessionLocal = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)


async def get_session() -> AsyncIterator[AsyncSession]:
    """FastAPI dependency yielding an async session (commit/rollback by caller)."""
    async with SessionLocal() as session:
        yield session


async def init_db() -> None:
    """
    Create tables if absent. Safe for SQLite/demo; for Postgres prefer Alembic
    (`alembic upgrade head`) but create_all is idempotent and harmless.
    """
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    logger.info("db.ready", url=DATABASE_URL.split("@")[-1])
