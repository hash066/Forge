"""Unit tests for the deterministic detectors — pure, no cluster required."""

from __future__ import annotations

import json
from pathlib import Path

import pytest

from devforge_operator.detectors import scan_deployment_rollout, scan_pod

FIXTURES = Path(__file__).parent.parent / "devforge_operator" / "fixtures" / "pods"


def _load(name: str) -> dict:
    return json.loads((FIXTURES / name).read_text(encoding="utf-8"))


def _reasons(pod: dict) -> set[str]:
    return {i["reason"] for i in scan_pod(pod)}


def test_crashloop_detected():
    reasons = _reasons(_load("crashloop-payments.json"))
    assert "CrashLoopBackOff" in reasons


def test_oom_detected():
    reasons = _reasons(_load("oom-cart.json"))
    assert "OOMKilled" in reasons


def test_imagepull_detected():
    reasons = _reasons(_load("imagepull-recommender.json"))
    assert "ImagePullBackOff" in reasons


def test_privileged_detected():
    reasons = _reasons(_load("privileged-logforwarder.json"))
    assert "PrivilegedPod" in reasons


def test_missing_limits_detected():
    reasons = _reasons(_load("nolimits-analytics.json"))
    assert "MissingLimits" in reasons


def test_unschedulable_detected():
    reasons = _reasons(_load("pending-batch.json"))
    assert "Unschedulable" in reasons


def test_healthy_pod_no_incidents():
    healthy = {
        "metadata": {"name": "web-1", "namespace": "shop"},
        "spec": {
            "containers": [
                {
                    "name": "web",
                    "image": "shop/web:v1",
                    "resources": {"limits": {"cpu": "500m", "memory": "256Mi"}},
                }
            ]
        },
        "status": {
            "phase": "Running",
            "containerStatuses": [
                {"name": "web", "ready": True, "restartCount": 0, "state": {"running": {}}}
            ],
        },
    }
    assert scan_pod(healthy) == []


def test_context_shape_is_postable():
    incidents = scan_pod(_load("oom-cart.json"))
    ctx = incidents[0]
    for key in ("namespace", "kind", "name", "reason", "severity", "spec_excerpt"):
        assert key in ctx
    assert ctx["kind"] == "Pod"


def test_stuck_rollout_detected():
    deployment = {
        "metadata": {"name": "api", "namespace": "shop"},
        "spec": {"template": {"spec": {"containers": [{"name": "api", "image": "api:v2"}]}}},
        "status": {
            "conditions": [
                {
                    "type": "Progressing",
                    "status": "False",
                    "reason": "ProgressDeadlineExceeded",
                    "message": "ReplicaSet api-xyz has timed out progressing.",
                }
            ]
        },
    }
    out = scan_deployment_rollout(deployment)
    assert len(out) == 1
    assert out[0]["reason"] == "StuckRollout"
    assert out[0]["kind"] == "Deployment"


if __name__ == "__main__":
    raise SystemExit(pytest.main([__file__, "-v"]))
