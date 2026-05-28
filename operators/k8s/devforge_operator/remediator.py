"""
Applies remediations to a live cluster via the Kubernetes API.

Only used in live mode (the simulator never touches a real cluster). Each RCA
remediation carries an ``action`` and, for patch-type fixes, a ready-to-apply
strategic-merge ``patch`` targeting the owning Deployment. We map actions to the
narrowest API call that resolves them.

The kubernetes client is imported lazily so the package imports (and unit-tests)
without it installed.
"""

from __future__ import annotations

from typing import Any

import structlog

logger = structlog.get_logger(__name__)

# Actions the operator is permitted to take autonomously (defence in depth on top
# of the RemediationPolicy CRD).
ALLOWED_ACTIONS = {
    "restart_pod",
    "rollback",
    "set_resources",
    "scale",
    "patch_image",
    "adjust_probe",
    "add_limits",
    "cordon_drain",
    "none",
}


def _workload_name(name: str, kind: str) -> str:
    if kind.lower() == "deployment":
        return name
    parts = name.split("-")
    return "-".join(parts[:-2]) if len(parts) > 2 else name


class Remediator:
    def __init__(self) -> None:
        from kubernetes import client, config  # lazy

        try:
            config.load_incluster_config()
        except Exception:  # noqa: BLE001
            config.load_kube_config()
        self._core = client.CoreV1Api()
        self._apps = client.AppsV1Api()
        self._ApiException = __import__(
            "kubernetes.client.rest", fromlist=["ApiException"]
        ).ApiException

    def apply(
        self,
        *,
        action: str,
        namespace: str,
        kind: str,
        name: str,
        patch: dict[str, Any] | None,
        dry_run: bool = False,
    ) -> tuple[bool, str]:
        """Returns (success, detail)."""
        if action not in ALLOWED_ACTIONS or action == "none":
            return False, f"action '{action}' not permitted"

        deploy = _workload_name(name, kind)
        dr = ["All"] if dry_run else None
        try:
            if action == "restart_pod" and kind.lower() == "pod":
                self._core.delete_namespaced_pod(name=name, namespace=namespace, dry_run=dr)
                return True, f"deleted pod {namespace}/{name} (will be recreated)"

            if action in ("set_resources", "add_limits", "adjust_probe", "patch_image") and patch:
                self._apps.patch_namespaced_deployment(
                    name=deploy, namespace=namespace, body=patch, dry_run=dr
                )
                return True, f"patched deployment {namespace}/{deploy} ({action})"

            if action == "rollback":
                return self._rollback(namespace, deploy, dry_run)

            if action == "scale":
                replicas = int(((patch or {}).get("spec") or {}).get("replicas", 1))
                self._apps.patch_namespaced_deployment_scale(
                    name=deploy,
                    namespace=namespace,
                    body={"spec": {"replicas": replicas}},
                    dry_run=dr,
                )
                return True, f"scaled {namespace}/{deploy} to {replicas}"

            if action == "cordon_drain":
                # node-level: mark unschedulable (drain is left to an operator runbook)
                self._core.patch_node(name=name, body={"spec": {"unschedulable": True}}, dry_run=dr)
                return True, f"cordoned node {name}"

            if patch:
                self._apps.patch_namespaced_deployment(
                    name=deploy, namespace=namespace, body=patch, dry_run=dr
                )
                return True, f"applied patch to {namespace}/{deploy}"

            return False, f"no executable mapping for action '{action}'"
        except self._ApiException as exc:  # type: ignore[attr-defined]
            logger.warning("remediator.api_error", action=action, error=str(exc))
            return False, f"k8s api error: {exc.reason if hasattr(exc, 'reason') else exc}"
        except Exception as exc:  # noqa: BLE001
            logger.exception("remediator.failed", action=action)
            return False, str(exc)

    def _rollback(self, namespace: str, deploy: str, dry_run: bool) -> tuple[bool, str]:
        """Roll a Deployment back to its previous revision (kubectl-rollout-undo equivalent)."""
        rs_list = self._apps.list_namespaced_replica_set(
            namespace=namespace, label_selector=f"app={deploy}"
        ).items
        revisioned = []
        for rs in rs_list:
            rev = (rs.metadata.annotations or {}).get("deployment.kubernetes.io/revision")
            if rev is not None:
                revisioned.append((int(rev), rs))
        if len(revisioned) < 2:
            # Fall back to a rollout restart (forces fresh pods from current spec)
            import datetime

            body = {
                "spec": {
                    "template": {
                        "metadata": {
                            "annotations": {
                                "devforge.io/restartedAt": datetime.datetime.utcnow().isoformat()
                            }
                        }
                    }
                }
            }
            self._apps.patch_namespaced_deployment(
                name=deploy, namespace=namespace, body=body, dry_run=["All"] if dry_run else None
            )
            return True, f"rollout-restarted {namespace}/{deploy} (no prior revision found)"

        revisioned.sort(key=lambda x: x[0])
        prev_rs = revisioned[-2][1]
        template = prev_rs.spec.template
        body = {"spec": {"template": template.to_dict()}}
        self._apps.patch_namespaced_deployment(
            name=deploy, namespace=namespace, body=body, dry_run=["All"] if dry_run else None
        )
        return True, f"rolled {namespace}/{deploy} back to revision {revisioned[-2][0]}"
