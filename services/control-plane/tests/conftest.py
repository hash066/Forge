"""
Pytest fixtures. Env is set BEFORE any app import so the control plane runs in a
hermetic mode: deterministic AI (no network/keys) + an isolated SQLite file.
"""

from __future__ import annotations

import os

# Must be set before importing app modules (settings + db URL are read at import).
os.environ.setdefault("AI_PROVIDER", "offline")
os.environ.setdefault("DATABASE_URL", "sqlite+aiosqlite:///./.pytest_devforge.db")
os.environ.setdefault("INTERNAL_API_KEY", "test-internal-key")

from collections.abc import AsyncIterator  # noqa: E402
from pathlib import Path  # noqa: E402

import pytest  # noqa: E402
import pytest_asyncio  # noqa: E402

_DB_FILE = Path("./.pytest_devforge.db")


@pytest.fixture(scope="session", autouse=True)
def _cleanup_db_file() -> AsyncIterator[None]:
    if _DB_FILE.exists():
        _DB_FILE.unlink()
    yield
    if _DB_FILE.exists():
        try:
            _DB_FILE.unlink()
        except OSError:
            pass


@pytest_asyncio.fixture
async def client() -> AsyncIterator["object"]:
    """An httpx AsyncClient bound to the ASGI app with a fresh schema per test."""
    from httpx import ASGITransport, AsyncClient

    from app.db.session import engine
    from app.main import app
    from app.models import Base

    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
        await conn.run_sync(Base.metadata.create_all)

    transport = ASGITransport(app=app)
    async with AsyncClient(
        transport=transport, base_url="http://test", headers={"X-Tenant-Id": "test"}
    ) as c:
        yield c
