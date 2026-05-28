"""
Deterministic incident detectors.

Pure functions over plain Kubernetes object dicts (exactly the shape returned by
``kubectl get pod -o json`` or the Python client's ``to_dict()``). Keeping them
pure means they unit-test with zero cluster and the same code powers both the
live operator and the offline simulator.

Detection is intentionally deterministic and cheap — the *diagnosis* (root cause
+ fix) is what the AI control plane does. The operator just decides "something
is wrong here, and roughly what class of wrong".
"""

from __future__ import annotations

from typing import Any

# Reason → default severity
SEVERITY = {
    "CrashLoopBackOff": "critical",
    "OOMKilled": "high",
    "ImagePullBackOff": "high",
    "ErrImagePull": "high",
    "ProbeFailure": "medium",
    "StuckRollout": "high",
    "Unschedulable": "medium",
    "MissingLimits": "low",
    "OverProvisioned": "low",
    "PrivilegedPod": "high",
    "HighRestarts": "high",
}

HIGH_RESTART_THRESHOLD = 5


def _spec_excerpt(spec: dict[str, Any]) -> dict[str, Any]:
    """Pull only the fields the RCA engine reasons about (keeps payloads small)."""
    containers = []
    for c in spec.get("containers", []) or []:
        containers.append(
            {
                "name": c.get("name"),
                "image": c.get("image"),
                "resources": c.get("resources", {}),
                "securityContext": c.get("securityContext", {}),
                "readinessProbe": c.get("readinessProbe"),
                "livenessProbe": c.get("livenessProbe"),
            }
        )
    return {
        "containers": containers,
        "volumes": [
            {"name": v.get("name"), "hostPath": v.get("hostPath")}
            for v in spec.get("volumes", []) or []
            if v.get("hostPath")
        ],
    }


def _waiting_reason(cs: dict[str, Any]) -> str | None:
    state = cs.get("state") or {}
    waiting = state.get("waiting") or {}
    return waiting.get("reason")


def _last_terminated_reason(cs: dict[str, Any]) -> str | None:
    last = cs.get("lastState") or {}
    term = last.get("terminated") or {}
    return term.get("reason")


def _mk_context(
    pod: dict[str, Any],
    reason: str,
    *,
    message: str = "",
    events: list[str] | None = None,
) -> dict[str, Any]:
    meta = pod.get("metadata", {}) or {}
    spec = pod.get("spec", {}) or {}
    status = pod.get("status", {}) or {}
    return {
        "namespace": meta.get("namespace", "default"),
        "kind": "Pod",
        "name": meta.get("name", "unknown"),
        "reason": reason,
        "severity": SEVERITY.get(reason, "medium"),
        "message": message,
        "events": events or [],
        "container_statuses": status.get("containerStatuses", []) or [],
        "spec_excerpt": _spec_excerpt(spec),
        "metrics": {},
    }


def scan_pod(pod: dict[str, Any], events: list[str] | None = None) -> list[dict[str, Any]]:
    """
    Return a list of incident-context dicts for everything wrong with this pod.
    Each dict is ready to POST to ``/v1/k8s/diagnose``.
    """
    incidents: list[dict[str, Any]] = []
    spec = pod.get("spec", {}) or {}
    status = pod.get("status", {}) or {}
    container_statuses = status.get("containerStatuses", []) or []
    containers = spec.get("containers", []) or []

    seen_reasons: set[str] = set()

    def add(reason: str, message: str = "") -> None:
        if reason in seen_reasons:
            return
        seen_reasons.add(reason)
        incidents.append(_mk_context(pod, reason, message=message, events=events))

    # ── Runtime faults (highest priority) ────────────────────────────────────
    for cs in container_statuses:
        waiting = _waiting_reason(cs)
        terminated = _last_terminated_reason(cs)
        restarts = cs.get("restartCount", 0) or 0

        if terminated == "OOMKilled":
            add("OOMKilled", f"Container {cs.get('name')} was OOMKilled")
        if waiting in ("ImagePullBackOff", "ErrImagePull"):
            add(waiting, f"Cannot pull image for {cs.get('name')}")
        if waiting == "CrashLoopBackOff":
            add("CrashLoopBackOff", f"Container {cs.get('name')} is crash-looping")
        elif restarts >= HIGH_RESTART_THRESHOLD and "CrashLoopBackOff" not in seen_reasons:
            add("HighRestarts", f"Container {cs.get('name')} restarted {restarts} times")

    # ── Scheduling ────────────────────────────────────────────────────────────
    if status.get("phase") == "Pending":
        for cond in status.get("conditions", []) or []:
            if cond.get("reason") == "Unschedulable":
                add("Unschedulable", cond.get("message", "Pod is unschedulable"))

    # ── Config / cost / security (advisory, only if no acute fault present) ────
    if not incidents:
        for c in containers:
            limits = (c.get("resources") or {}).get("limits") or {}
            if not limits:
                add("MissingLimits", f"Container {c.get('name')} has no resource limits")
                break

    # Security smells are always reported (independent of runtime state)
    for c in containers:
        sec = c.get("securityContext") or {}
        if sec.get("privileged") is True or sec.get("runAsUser") == 0:
            add("PrivilegedPod", f"Container {c.get('name')} runs privileged/root")
            break
    if any(v.get("hostPath") for v in (spec.get("volumes") or [])):
        add("PrivilegedPod", "Pod mounts a hostPath volume")

    return incidents


def scan_deployment_rollout(deployment: dict[str, Any]) -> list[dict[str, Any]]:
    """Detect a stuck rollout from a Deployment's status conditions."""
    meta = deployment.get("metadata", {}) or {}
    status = deployment.get("status", {}) or {}
    for cond in status.get("conditions", []) or []:
        if cond.get("type") == "Progressing" and cond.get("reason") == "ProgressDeadlineExceeded":
            return [
                {
                    "namespace": meta.get("namespace", "default"),
                    "kind": "Deployment",
                    "name": meta.get("name", "unknown"),
                    "reason": "StuckRollout",
                    "severity": SEVERITY["StuckRollout"],
                    "message": cond.get("message", "Rollout exceeded its progress deadline"),
                    "events": [],
                    "container_statuses": [],
                    "spec_excerpt": _spec_excerpt(
                        (deployment.get("spec", {}).get("template", {}) or {}).get("spec", {}) or {}
                    ),
                    "metrics": {},
                }
            ]
    return []
