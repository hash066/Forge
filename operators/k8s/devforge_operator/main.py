"""
DevForge OS operator (live mode).

A kopf-based controller that watches Pods + Deployments, runs the deterministic
detectors, asks the control plane for an AI diagnosis, and — when policy allows —
applies the remediation and reports the outcome. It also publishes periodic
cluster snapshots so the dashboard shows live health/cost/security posture.

Run with:  kopf run -m devforge_operator.main
(See the simulator for a cluster-free demo path.)
"""

from __future__ import annotations

import asyncio
import logging
from typing import Any

import structlog

from devforge_operator.client import ControlPlaneClient
from devforge_operator.config import OperatorConfig, get_config
from devforge_operator.detectors import scan_deployment_rollout, scan_pod

logger = structlog.get_logger(__name__)

try:
    import kopf
except Exception:  # pragma: no cover - kopf only needed for live mode
    kopf = None  # type: ignore[assignment]

_cfg: OperatorConfig = get_config()
_client: ControlPlaneClient | None = None
_bg_tasks: set[asyncio.Task[Any]] = set()


def _get_client() -> ControlPlaneClient:
    global _client
    if _client is None:
        _client = ControlPlaneClient(_cfg)
    return _client


def _namespace_allowed(namespace: str | None) -> bool:
    if not namespace:
        return False
    if namespace in _cfg.excluded:
        return False
    watched = _cfg.watched
    return not watched or namespace in watched


async def _handle_contexts(contexts: list[dict[str, Any]]) -> None:
    if not contexts:
        return
    client = _get_client()
    for ctx in contexts:
        try:
            resp = await client.diagnose(ctx)
        except Exception as exc:  # noqa: BLE001
            logger.warning("operator.diagnose_failed", error=str(exc), name=ctx.get("name"))
            continue

        rem = resp.get("rca", {}).get("remediation", {})
        action = rem.get("action", "none")
        should_apply = _cfg.mode == "auto" and rem.get("mode") == "auto" and action != "none"
        logger.info(
            "operator.incident",
            reason=ctx.get("reason"),
            action=action,
            apply=should_apply,
            provider=resp.get("provider"),
        )
        if not should_apply:
            continue

        try:
            from devforge_operator.remediator import Remediator

            ok, detail = Remediator().apply(
                action=action,
                namespace=ctx.get("namespace", "default"),
                kind=ctx.get("kind", "Pod"),
                name=ctx.get("name", ""),
                patch=rem.get("patch"),
            )
            await client.report_remediation(
                incident_id=resp["incident_id"],
                remediation_id=resp.get("remediation_id"),
                action=action,
                target=rem.get("target", ""),
                status="applied" if ok else "failed",
                detail=f"devforge-operator: {detail}",
            )
        except Exception as exc:  # noqa: BLE001
            logger.exception("operator.remediate_failed", error=str(exc))
            await client.report_remediation(
                incident_id=resp["incident_id"],
                remediation_id=resp.get("remediation_id"),
                action=action,
                target=rem.get("target", ""),
                status="failed",
                detail=f"devforge-operator: {exc}",
            )


async def _snapshot_loop() -> None:
    """Periodically push a cluster snapshot (live mode)."""
    from kubernetes import client as k8s_client
    from kubernetes import config as k8s_config

    try:
        k8s_config.load_incluster_config()
    except Exception:  # noqa: BLE001
        k8s_config.load_kube_config()
    core = k8s_client.CoreV1Api()
    cp = _get_client()

    while True:
        try:
            pods = core.list_pod_for_all_namespaces(watch=False).items
            relevant = [p for p in pods if _namespace_allowed(p.metadata.namespace)]
            total = len(relevant)
            healthy = sum(
                1
                for p in relevant
                if all(cs.ready for cs in (p.status.container_statuses or []))
                and p.status.phase in ("Running", "Succeeded")
            )
            namespaces = len({p.metadata.namespace for p in relevant})
            await cp.snapshot(
                {
                    "cluster": _cfg.cluster_name,
                    "nodes": len(core.list_node().items),
                    "pods_total": total,
                    "pods_healthy": healthy,
                    "namespaces": namespaces,
                    "health_score": round(100.0 * healthy / total, 1) if total else 100.0,
                    "detail": {"source": "operator"},
                }
            )
        except Exception as exc:  # noqa: BLE001
            logger.warning("operator.snapshot_failed", error=str(exc))
        await asyncio.sleep(_cfg.snapshot_interval)


if kopf is not None:

    @kopf.on.startup()
    async def _startup(settings: "kopf.OperatorSettings", **_: Any) -> None:  # type: ignore[name-defined]
        settings.posting.enabled = False  # don't spam k8s events
        logging.getLogger("kopf").setLevel(logging.WARNING)
        logger.info("operator.startup", mode=_cfg.mode, control_plane=_cfg.control_plane_url)
        task = asyncio.ensure_future(_snapshot_loop())
        _bg_tasks.add(task)
        task.add_done_callback(_bg_tasks.discard)

    @kopf.on.cleanup()
    async def _cleanup(**_: Any) -> None:
        for task in list(_bg_tasks):
            task.cancel()
        if _client is not None:
            await _client.aclose()

    @kopf.on.event("", "v1", "pods")  # type: ignore[misc]
    async def _on_pod_event(body: Any, namespace: str, **_: Any) -> None:
        if not _namespace_allowed(namespace):
            return
        await _handle_contexts(scan_pod(dict(body)))

    @kopf.on.event("apps", "v1", "deployments")  # type: ignore[misc]
    async def _on_deploy_event(body: Any, namespace: str, **_: Any) -> None:
        if not _namespace_allowed(namespace):
            return
        await _handle_contexts(scan_deployment_rollout(dict(body)))
