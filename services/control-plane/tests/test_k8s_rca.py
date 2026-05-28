"""Root-cause engine tests — deterministic rules + JSON parsing + dispatch."""

from __future__ import annotations

import pytest

from app.schemas.k8s import IncidentContext
from app.services.ai import get_ai_provider
from app.services.k8s_rca import _parse_rca, deterministic_rca, diagnose


def _ctx(reason: str, **kw) -> IncidentContext:
    return IncidentContext(namespace="shop", kind="Pod", name="api-7c5-x2", reason=reason, **kw)


@pytest.mark.parametrize(
    ("reason", "action"),
    [
        ("CrashLoopBackOff", "rollback"),
        ("OOMKilled", "set_resources"),
        ("ImagePullBackOff", "patch_image"),
        ("ErrImagePull", "patch_image"),
        ("ProbeFailure", "adjust_probe"),
        ("StuckRollout", "rollback"),
        ("Unschedulable", "set_resources"),
        ("MissingLimits", "add_limits"),
        ("PrivilegedPod", "patch_image"),
    ],
)
def test_deterministic_rule_actions(reason: str, action: str):
    rca = deterministic_rca(_ctx(reason))
    assert rca.remediation.action == action
    assert rca.root_cause
    assert rca.remediation.target == "shop/Pod/api-7c5-x2"
    assert 0.0 <= rca.confidence <= 1.0


def test_oom_bumps_memory_from_spec():
    ctx = _ctx(
        "OOMKilled",
        spec_excerpt={"containers": [{"name": "api", "resources": {"limits": {"memory": "256Mi"}}}]},
    )
    rca = deterministic_rca(ctx)
    # 256Mi * 1.5 = 384Mi
    assert "384Mi" in rca.summary
    assert rca.remediation.patch  # carries a strategic-merge patch


def test_unknown_reason_falls_back():
    rca = deterministic_rca(_ctx("SomethingNovel"))
    assert rca.remediation.action in {"restart_pod", "none"}


def test_parse_rca_valid():
    payload = {
        "root_cause": "bad config",
        "summary": "boom",
        "confidence": 0.9,
        "category": "config",
        "evidence": ["e1"],
        "remediation": {"action": "rollback", "target": "ns/Pod/x", "risk": "low", "mode": "auto"},
    }
    rca = _parse_rca(payload, _ctx("CrashLoopBackOff"))
    assert rca is not None
    assert rca.remediation.action == "rollback"
    assert rca.confidence == 0.9


def test_parse_rca_rejects_garbage():
    assert _parse_rca({"nope": 1}, _ctx("OOMKilled")) is None
    assert _parse_rca(None, _ctx("OOMKilled")) is None


@pytest.mark.asyncio
async def test_diagnose_uses_deterministic_offline():
    provider = get_ai_provider()  # offline in tests
    rca, ai = await diagnose(provider, _ctx("OOMKilled"))
    assert ai is None  # deterministic path
    assert rca.remediation.action == "set_resources"
