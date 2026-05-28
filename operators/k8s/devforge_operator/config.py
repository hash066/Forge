"""Operator configuration — entirely environment-driven (12-factor)."""

from __future__ import annotations

import os
from dataclasses import dataclass


@dataclass(frozen=True)
class OperatorConfig:
    control_plane_url: str = os.getenv("DEVFORGE_CONTROL_PLANE_URL", "http://localhost:8000")
    tenant_id: str = os.getenv("DEVFORGE_TENANT_ID", "demo")
    api_key: str = os.getenv("DEVFORGE_API_KEY", "")
    # auto = apply fixes automatically; suggest = propose only; off = observe only
    mode: str = os.getenv("DEVFORGE_MODE", "suggest")
    cluster_name: str = os.getenv("DEVFORGE_CLUSTER", "kind-devforge")
    snapshot_interval: float = float(os.getenv("DEVFORGE_SNAPSHOT_INTERVAL", "30"))
    # comma-separated namespaces to watch; empty = all non-system namespaces
    watch_namespaces: str = os.getenv("DEVFORGE_NAMESPACES", "")
    excluded_namespaces: str = os.getenv(
        "DEVFORGE_EXCLUDED_NAMESPACES", "kube-system,kube-public,kube-node-lease,devforge-system"
    )

    @property
    def excluded(self) -> set[str]:
        return {n.strip() for n in self.excluded_namespaces.split(",") if n.strip()}

    @property
    def watched(self) -> set[str]:
        return {n.strip() for n in self.watch_namespaces.split(",") if n.strip()}


def get_config() -> OperatorConfig:
    return OperatorConfig()
