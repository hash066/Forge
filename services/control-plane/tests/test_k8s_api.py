"""End-to-end API tests for the DevForge OS Kubernetes surface."""

from __future__ import annotations

import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_diagnose_oom_auto_remediating(client: AsyncClient):
    body = {
        "namespace": "shop",
        "kind": "Pod",
        "name": "cart-api-7c5d9f8b6d-x2k9p",
        "reason": "OOMKilled",
        "severity": "high",
        "spec_excerpt": {"containers": [{"name": "cart", "resources": {"limits": {"memory": "256Mi"}}}]},
    }
    r = await client.post("/v1/k8s/diagnose", json=body)
    assert r.status_code == 200
    data = r.json()
    assert data["rca"]["remediation"]["action"] == "set_resources"
    assert data["status"] == "remediating"  # OOM rule is auto mode
    assert data["incident_id"]
    assert data["remediation_id"]


@pytest.mark.asyncio
async def test_tenant_isolation(client: AsyncClient):
    """An incident created under one tenant must be invisible to another."""
    diag = (
        await client.post(
            "/v1/k8s/diagnose",
            json={"namespace": "x", "name": "y", "reason": "OOMKilled", "severity": "high"},
        )
    ).json()
    inc_id = diag["incident_id"]

    # A different tenant sees none of it
    other = await client.get("/v1/k8s/incidents", headers={"X-Tenant-Id": "other-tenant"})
    assert inc_id not in [i["id"] for i in other.json()]

    # …and cannot fetch it directly
    r = await client.get(
        f"/v1/k8s/incidents/{inc_id}", headers={"X-Tenant-Id": "other-tenant"}
    )
    assert r.status_code == 404


@pytest.mark.asyncio
async def test_full_heal_cycle(client: AsyncClient):
    diag = (
        await client.post(
            "/v1/k8s/diagnose",
            json={"namespace": "ml", "name": "rec-1", "reason": "ImagePullBackOff", "severity": "high"},
        )
    ).json()
    inc_id = diag["incident_id"]

    # report applied → incident resolves
    rep = await client.post(
        "/v1/k8s/remediate",
        json={"incident_id": inc_id, "remediation_id": diag["remediation_id"], "status": "applied"},
    )
    assert rep.status_code == 200

    detail = (await client.get(f"/v1/k8s/incidents/{inc_id}")).json()
    assert detail["status"] == "resolved"


@pytest.mark.asyncio
async def test_overview_and_audit(client: AsyncClient):
    await client.post(
        "/v1/k8s/diagnose",
        json={"namespace": "shop", "name": "p1", "reason": "CrashLoopBackOff", "severity": "critical"},
    )
    await client.post(
        "/v1/k8s/snapshot",
        json={"cluster": "kind", "pods_total": 10, "pods_healthy": 9, "health_score": 90.0},
    )

    ov = (await client.get("/v1/k8s/overview")).json()
    assert ov["stats"]["total"] >= 1
    assert ov["snapshot"]["health_score"] == 90.0

    incidents = (await client.get("/v1/k8s/incidents")).json()
    assert isinstance(incidents, list) and len(incidents) >= 1

    audit = (await client.get("/v1/k8s/audit")).json()
    assert any(a["action"] == "incident.diagnosed" for a in audit)


@pytest.mark.asyncio
async def test_remediation_policy_governs_mode(client: AsyncClient):
    """Settings must actually change behaviour: policy mode overrides the RCA mode."""
    h = {"X-Tenant-Id": "policy-test"}  # isolate from other tests' default tenant
    oom = {"namespace": "shop", "name": "pol-a-1", "reason": "OOMKilled", "severity": "high"}

    # No policy yet → OOM auto-heals (the rule's own mode).
    d1 = (await client.post("/v1/k8s/diagnose", json=oom, headers=h)).json()
    assert d1["status"] == "remediating"

    # Switch the tenant policy to "suggest".
    put = await client.put("/v1/k8s/settings", json={"mode": "suggest"}, headers=h)
    assert put.status_code == 200
    assert put.json()["policy"]["mode"] == "suggest"

    # A new incident now waits for approval instead of auto-healing.
    d2 = (
        await client.post(
            "/v1/k8s/diagnose",
            json={**oom, "name": "pol-b-1"},
            headers=h,
        )
    ).json()
    assert d2["status"] == "suggested"

    # GET settings reflects the persisted policy + AI status.
    s = (await client.get("/v1/k8s/settings", headers=h)).json()
    assert s["policy"]["mode"] == "suggest"
    assert "ai_provider" in s and "ai_connected" in s
