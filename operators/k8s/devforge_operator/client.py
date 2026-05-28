"""Async HTTP client for the DevForge control plane."""

from __future__ import annotations

from typing import Any

import httpx
import structlog

from devforge_operator.config import OperatorConfig

logger = structlog.get_logger(__name__)


class ControlPlaneClient:
    def __init__(self, cfg: OperatorConfig) -> None:
        headers = {"X-Tenant-Id": cfg.tenant_id}
        if cfg.api_key:
            headers["X-API-Key"] = cfg.api_key
        self._client = httpx.AsyncClient(
            base_url=cfg.control_plane_url, headers=headers, timeout=httpx.Timeout(45.0)
        )

    async def diagnose(self, context: dict[str, Any]) -> dict[str, Any]:
        resp = await self._client.post("/v1/k8s/diagnose", json=context)
        resp.raise_for_status()
        return resp.json()

    async def report_remediation(self, **payload: Any) -> dict[str, Any]:
        resp = await self._client.post("/v1/k8s/remediate", json=payload)
        resp.raise_for_status()
        return resp.json()

    async def snapshot(self, snapshot: dict[str, Any]) -> dict[str, Any]:
        resp = await self._client.post("/v1/k8s/snapshot", json=snapshot)
        resp.raise_for_status()
        return resp.json()

    async def health(self) -> bool:
        try:
            resp = await self._client.get("/health")
            return resp.status_code == 200
        except httpx.HTTPError:
            return False

    async def aclose(self) -> None:
        await self._client.aclose()
