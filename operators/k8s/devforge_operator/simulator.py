"""
Cluster simulator — the zero-dependency demo engine.

Replays realistic broken-pod fixtures through the *exact same* detector pipeline
the live operator uses, then drives the full self-healing narrative against the
control plane:

    detect (scan_pod)  →  POST /v1/k8s/diagnose  →  [AI root cause + fix shown]
                       →  POST /v1/k8s/remediate  →  [incident heals on dashboard]
                       →  POST /v1/k8s/snapshot   →  [cluster health climbs back up]

No Kubernetes cluster, Docker, or cloud is required — perfect for a live demo or
CI. Point it at a running control plane and watch the dashboard come alive.
"""

from __future__ import annotations

import asyncio
import json
from pathlib import Path
from typing import Any

import structlog

from devforge_operator.client import ControlPlaneClient
from devforge_operator.config import OperatorConfig, get_config
from devforge_operator.detectors import scan_pod

logger = structlog.get_logger(__name__)

FIXTURES_DIR = Path(__file__).parent / "fixtures" / "pods"

# Baseline of an otherwise-healthy cluster the broken pods live in.
BASELINE = {
    "nodes": 3,
    "pods_total": 24,
    "namespaces": 6,
    "monthly_cost_usd": 540.0,
}


def load_pod_fixtures() -> list[dict[str, Any]]:
    pods: list[dict[str, Any]] = []
    if not FIXTURES_DIR.exists():
        return pods
    for path in sorted(FIXTURES_DIR.glob("*.json")):
        try:
            pods.append(json.loads(path.read_text(encoding="utf-8")))
        except json.JSONDecodeError:
            logger.warning("simulator.bad_fixture", file=str(path))
    return pods


def _snapshot(cfg: OperatorConfig, healthy: int, total: int, waste: float, findings: int) -> dict:
    health_score = round(100.0 * healthy / total, 1) if total else 100.0
    return {
        "cluster": cfg.cluster_name,
        "nodes": BASELINE["nodes"],
        "pods_total": total,
        "pods_healthy": healthy,
        "namespaces": BASELINE["namespaces"],
        "health_score": health_score,
        "monthly_cost_usd": BASELINE["monthly_cost_usd"],
        "monthly_waste_usd": round(waste, 2),
        "security_findings": findings,
        "detail": {"source": "simulator"},
    }


async def run(
    cfg: OperatorConfig | None = None,
    *,
    loop: bool = False,
    detect_delay: float = 1.6,
    heal_delay: float = 2.4,
) -> None:
    cfg = cfg or get_config()
    client = ControlPlaneClient(cfg)

    if not await client.health():
        logger.error("simulator.control_plane_unreachable", url=cfg.control_plane_url)
        await client.aclose()
        raise SystemExit(
            f"Control plane not reachable at {cfg.control_plane_url}. Start it first."
        )

    pods = load_pod_fixtures()
    if not pods:
        logger.error("simulator.no_fixtures", dir=str(FIXTURES_DIR))
        await client.aclose()
        raise SystemExit("No pod fixtures found.")

    logger.info("simulator.start", url=cfg.control_plane_url, mode=cfg.mode, fixtures=len(pods))

    try:
        while True:
            contexts: list[dict[str, Any]] = []
            for pod in pods:
                contexts.extend(scan_pod(pod))

            total = BASELINE["pods_total"]
            broken = len(contexts)
            findings = sum(1 for c in contexts if c["reason"] == "PrivilegedPod")
            waste = sum(40.0 for c in contexts if c["reason"] in ("OverProvisioned", "MissingLimits"))

            # 1) cluster starts degraded
            await client.snapshot(_snapshot(cfg, total - broken, total, waste, findings))
            logger.info("simulator.cluster_degraded", broken=broken, health=round(100*(total-broken)/total))

            # 2) detect + diagnose each incident (dashboard lights up)
            diagnosed: list[dict[str, Any]] = []
            for ctx in contexts:
                resp = await client.diagnose(ctx)
                diagnosed.append(resp)
                rem = resp["rca"]["remediation"]
                logger.info(
                    "simulator.diagnosed",
                    reason=ctx["reason"],
                    action=rem["action"],
                    mode=rem["mode"],
                    provider=resp.get("provider"),
                )
                await asyncio.sleep(detect_delay)

            # 3) heal one by one (dashboard shows incidents resolving + health climbing)
            healthy = total - broken
            for resp in diagnosed:
                await asyncio.sleep(heal_delay)
                rem = resp["rca"]["remediation"]
                # suggest-mode incidents pass through an approval gate first
                if rem["mode"] != "auto":
                    await client.report_remediation(
                        incident_id=resp["incident_id"],
                        remediation_id=resp.get("remediation_id"),
                        action=rem["action"],
                        target=rem["target"],
                        status="approved",
                        detail="operator: approved",
                    )
                    await asyncio.sleep(heal_delay * 0.4)
                await client.report_remediation(
                    incident_id=resp["incident_id"],
                    remediation_id=resp.get("remediation_id"),
                    action=rem["action"],
                    target=rem["target"],
                    status="applied",
                    detail="devforge-operator: remediated and verified healthy",
                )
                healthy += 1
                findings = max(0, findings - (1 if rem["action"] == "patch_image" else 0))
                waste = max(0.0, waste - 40.0) if rem["action"] in ("set_resources",) else waste
                await client.snapshot(_snapshot(cfg, healthy, total, waste, findings))
                logger.info("simulator.healed", target=rem["target"], health=round(100*healthy/total))

            logger.info("simulator.cluster_healthy", health=100)
            if not loop:
                break
            await asyncio.sleep(8.0)
    finally:
        await client.aclose()


def main() -> None:
    import argparse

    parser = argparse.ArgumentParser(description="DevForge OS cluster simulator")
    parser.add_argument("--loop", action="store_true", help="run continuously")
    parser.add_argument("--detect-delay", type=float, default=1.6)
    parser.add_argument("--heal-delay", type=float, default=2.4)
    args = parser.parse_args()
    asyncio.run(run(loop=args.loop, detect_delay=args.detect_delay, heal_delay=args.heal_delay))


if __name__ == "__main__":
    main()
