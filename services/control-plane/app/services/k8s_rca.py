"""
Kubernetes root-cause analysis engine.

Two paths, one interface:
  • LLM path — sends the incident context to the configured AI provider (OpenAI
    by default) with the autonomous-SRE system prompt, parses structured JSON.
  • Deterministic path — a rule table keyed by the detector reason. Used when no
    model is configured (offline demo) or the LLM output can't be parsed. It is
    deliberately rich so the product is genuinely useful — and demos flawlessly —
    with zero external dependencies.

The deterministic rules encode real SRE judgement (rollback a crash-looping
Deployment, bump memory on OOMKilled, fix the image tag on ImagePullBackOff,
right-size an over-provisioned workload, etc.).
"""

from __future__ import annotations

import re

import structlog

from app.schemas.k8s import RCA, IncidentContext, RemediationPlan
from app.services.ai import AIProvider, AIResult
from app.services.prompts import K8S_SRE_SYSTEM, diagnose_k8s_incident

logger = structlog.get_logger(__name__)


# ── helpers ───────────────────────────────────────────────────────────────────
def _target(ctx: IncidentContext) -> str:
    return f"{ctx.namespace}/{ctx.kind}/{ctx.name}"


def _workload_name(ctx: IncidentContext) -> str:
    """Best-effort owning Deployment name (strips ReplicaSet+Pod hash suffixes)."""
    if ctx.kind.lower() == "deployment":
        return ctx.name
    parts = ctx.name.split("-")
    if len(parts) > 2:
        return "-".join(parts[:-2])
    return ctx.name


def _deploy_ref(ctx: IncidentContext) -> str:
    return f"deployment/{_workload_name(ctx)}"


_MEM_RE = re.compile(r"(\d+)\s*(Mi|Gi|M|G)?", re.IGNORECASE)


def _current_mem_limit(ctx: IncidentContext) -> str | None:
    try:
        containers = ctx.spec_excerpt.get("containers") or []
        for c in containers:
            lim = (c.get("resources") or {}).get("limits") or {}
            if lim.get("memory"):
                return str(lim["memory"])
    except Exception:
        return None
    return None


def _bumped_mem(ctx: IncidentContext, factor: float = 1.5) -> str:
    current = _current_mem_limit(ctx) or "256Mi"
    m = _MEM_RE.match(current.strip())
    if not m:
        return "512Mi"
    value = int(m.group(1))
    unit = (m.group(2) or "Mi").rstrip("iI").upper()  # M or G
    bumped = int(value * factor)
    return f"{bumped}{'Gi' if unit == 'G' else 'Mi'}"


def _default_evidence(ctx: IncidentContext) -> list[str]:
    evidence: list[str] = []
    if ctx.message:
        evidence.append(ctx.message.strip()[:240])
    for ev in ctx.events[:3]:
        evidence.append(str(ev)[:240])
    for cs in ctx.container_statuses[:2]:
        state = cs.get("state") or cs.get("lastState") or {}
        reason = None
        if isinstance(state, dict):
            for v in state.values():
                if isinstance(v, dict) and v.get("reason"):
                    reason = v["reason"]
                    break
        restarts = cs.get("restartCount")
        bit = f"container {cs.get('name', '?')}"
        if reason:
            bit += f": {reason}"
        if restarts is not None:
            bit += f" (restarts={restarts})"
        evidence.append(bit)
    if not evidence:
        evidence.append(f"{ctx.reason} detected on {_target(ctx)}")
    return evidence[:8]


def _mk(
    ctx: IncidentContext,
    *,
    root_cause: str,
    summary: str,
    category: str,
    action: str,
    rationale: str,
    risk: str,
    mode: str,
    commands: list[str],
    patch: dict | None = None,
    confidence: float = 0.78,
) -> RCA:
    return RCA(
        root_cause=root_cause,
        summary=summary,
        confidence=confidence,
        category=category,
        evidence=_default_evidence(ctx),
        remediation=RemediationPlan(
            action=action,
            target=_target(ctx),
            rationale=rationale,
            patch=patch or {},
            risk=risk,  # type: ignore[arg-type]
            mode=mode,  # type: ignore[arg-type]
            commands=commands,
        ),
    )


# ── deterministic rule table ────────────────────────────────────────────────────
def _rule_crashloop(ctx: IncidentContext) -> RCA:
    return _mk(
        ctx,
        root_cause=(
            "The container repeatedly exits with a non-zero status shortly after start. "
            "This is a startup-time fault — most often a regression shipped by the latest "
            "rollout, or a missing/invalid environment variable or config value."
        ),
        summary="Container is crash-looping on startup — most likely a bad rollout or missing config.",
        category="reliability",
        action="rollback",
        rationale=(
            "Rolling back to the previous healthy ReplicaSet restores the last known-good "
            "image and configuration immediately, stopping the crash loop while the "
            "regression is investigated out-of-band."
        ),
        risk="low",
        mode="auto",
        commands=[f"kubectl -n {ctx.namespace} rollout undo {_deploy_ref(ctx)}"],
        confidence=0.82,
    )


def _rule_oom(ctx: IncidentContext) -> RCA:
    new_mem = _bumped_mem(ctx)
    return _mk(
        ctx,
        root_cause=(
            "The container exceeded its memory limit and was OOM-killed by the kernel. "
            "The configured limit sits below the workload's real working set."
        ),
        summary=f"Pod OOMKilled — memory limit too low; raise to {new_mem}.",
        category="resource",
        action="set_resources",
        rationale=(
            f"Raising the memory request/limit to {new_mem} (~1.5× the prior limit) gives "
            "headroom above the observed working set and eliminates the OOM kills without "
            "over-allocating."
        ),
        risk="low",
        mode="auto",
        commands=[
            f"kubectl -n {ctx.namespace} set resources {_deploy_ref(ctx)} "
            f"--limits=memory={new_mem} --requests=memory={new_mem}"
        ],
        patch={
            "spec": {
                "template": {
                    "spec": {
                        "containers": [
                            {
                                "name": _workload_name(ctx),
                                "resources": {
                                    "limits": {"memory": new_mem},
                                    "requests": {"memory": new_mem},
                                },
                            }
                        ]
                    }
                }
            }
        },
        confidence=0.85,
    )


def _rule_imagepull(ctx: IncidentContext) -> RCA:
    return _mk(
        ctx,
        root_cause=(
            "The kubelet cannot pull the container image. The tag is invalid/nonexistent, "
            "or the registry requires credentials that are missing from an imagePullSecret."
        ),
        summary="ImagePullBackOff — bad image tag or missing pull credentials.",
        category="image",
        action="patch_image",
        rationale=(
            "Pinning the workload back to the last successfully-running image tag restores "
            "scheduling immediately; if the registry is private, attach a valid "
            "imagePullSecret."
        ),
        risk="medium",
        mode="suggest",
        commands=[
            f"kubectl -n {ctx.namespace} rollout undo {_deploy_ref(ctx)}",
            f"kubectl -n {ctx.namespace} describe pod {ctx.name}",
        ],
        confidence=0.8,
    )


def _rule_probe(ctx: IncidentContext) -> RCA:
    return _mk(
        ctx,
        root_cause=(
            "The readiness/liveness probe is failing although the app is likely healthy. "
            "The probe's initialDelaySeconds/timeout is too aggressive for the container's "
            "real startup time, or the probe path/port is wrong."
        ),
        summary="Probe failing — likely too-aggressive initialDelay/timeout.",
        category="config",
        action="adjust_probe",
        rationale=(
            "Increasing initialDelaySeconds and timeoutSeconds gives the container time to "
            "become ready and stops Kubernetes from killing a healthy pod."
        ),
        risk="low",
        mode="suggest",
        commands=[f"kubectl -n {ctx.namespace} edit {_deploy_ref(ctx)}"],
        patch={
            "spec": {
                "template": {
                    "spec": {
                        "containers": [
                            {
                                "name": _workload_name(ctx),
                                "readinessProbe": {
                                    "initialDelaySeconds": 20,
                                    "timeoutSeconds": 5,
                                    "failureThreshold": 6,
                                },
                            }
                        ]
                    }
                }
            }
        },
        confidence=0.74,
    )


def _rule_stuck_rollout(ctx: IncidentContext) -> RCA:
    return _mk(
        ctx,
        root_cause=(
            "A Deployment rollout is not progressing — the new ReplicaSet cannot reach "
            "the desired ready count within the progress deadline, usually because the new "
            "pods are failing to become ready."
        ),
        summary="Rollout stuck — new ReplicaSet not progressing.",
        category="reliability",
        action="rollback",
        rationale=(
            "Undoing the rollout returns traffic to the healthy previous revision while the "
            "failing change is fixed, protecting availability."
        ),
        risk="low",
        mode="auto",
        commands=[f"kubectl -n {ctx.namespace} rollout undo {_deploy_ref(ctx)}"],
        confidence=0.8,
    )


def _rule_unschedulable(ctx: IncidentContext) -> RCA:
    return _mk(
        ctx,
        root_cause=(
            "The pod is Pending and unschedulable. The scheduler cannot find a node that "
            "satisfies the pod's resource requests (or nodeSelector/affinity) — the cluster "
            "is at capacity or requests are oversized."
        ),
        summary="Pod unschedulable — insufficient cluster capacity for its requests.",
        category="resource",
        action="set_resources",
        rationale=(
            "Right-sizing the CPU/memory requests to realistic values lets the scheduler "
            "place the pod on existing nodes; alternatively add a node to the pool."
        ),
        risk="medium",
        mode="suggest",
        commands=[
            f"kubectl -n {ctx.namespace} describe pod {ctx.name}",
            f"kubectl -n {ctx.namespace} set resources {_deploy_ref(ctx)} --requests=cpu=100m,memory=128Mi",
        ],
        confidence=0.72,
    )


def _rule_missing_limits(ctx: IncidentContext) -> RCA:
    return _mk(
        ctx,
        root_cause=(
            "The workload declares no resource limits. An unbounded container can starve "
            "neighbours of CPU/memory and makes the node's scheduling unpredictable."
        ),
        summary="No resource limits set — noisy-neighbour and reliability risk.",
        category="reliability",
        action="add_limits",
        rationale=(
            "Adding sane CPU/memory requests and limits restores predictable scheduling and "
            "protects co-located workloads."
        ),
        risk="low",
        mode="suggest",
        commands=[
            f"kubectl -n {ctx.namespace} set resources {_deploy_ref(ctx)} "
            "--requests=cpu=100m,memory=128Mi --limits=cpu=500m,memory=512Mi"
        ],
        patch={
            "spec": {
                "template": {
                    "spec": {
                        "containers": [
                            {
                                "name": _workload_name(ctx),
                                "resources": {
                                    "requests": {"cpu": "100m", "memory": "128Mi"},
                                    "limits": {"cpu": "500m", "memory": "512Mi"},
                                },
                            }
                        ]
                    }
                }
            }
        },
        confidence=0.7,
    )


def _rule_overprovisioned(ctx: IncidentContext) -> RCA:
    return _mk(
        ctx,
        root_cause=(
            "The workload requests far more CPU/memory than it actually uses. The reserved "
            "headroom is wasted spend and reduces bin-packing efficiency across the cluster."
        ),
        summary="Over-provisioned requests — right-size to cut cost.",
        category="cost",
        action="set_resources",
        rationale=(
            "Lowering requests to ~1.3× observed P95 usage reclaims wasted capacity and cuts "
            "node cost while keeping a safe margin."
        ),
        risk="low",
        mode="suggest",
        commands=[
            f"kubectl -n {ctx.namespace} set resources {_deploy_ref(ctx)} --requests=cpu=150m,memory=192Mi"
        ],
        confidence=0.73,
    )


def _rule_privileged(ctx: IncidentContext) -> RCA:
    return _mk(
        ctx,
        root_cause=(
            "The pod runs a privileged / root container (or mounts a hostPath). This grants "
            "node-level access and is a critical container-escape risk."
        ),
        summary="Privileged container — critical security misconfiguration.",
        category="security",
        action="patch_image",
        rationale=(
            "Dropping privilege (runAsNonRoot, drop ALL capabilities, no privilege "
            "escalation) removes the escape vector while keeping the workload running."
        ),
        risk="medium",
        mode="suggest",
        commands=[f"kubectl -n {ctx.namespace} edit {_deploy_ref(ctx)}"],
        patch={
            "spec": {
                "template": {
                    "spec": {
                        "containers": [
                            {
                                "name": _workload_name(ctx),
                                "securityContext": {
                                    "privileged": False,
                                    "runAsNonRoot": True,
                                    "allowPrivilegeEscalation": False,
                                    "capabilities": {"drop": ["ALL"]},
                                },
                            }
                        ]
                    }
                }
            }
        },
        confidence=0.84,
    )


def _rule_high_restarts(ctx: IncidentContext) -> RCA:
    rca = _rule_crashloop(ctx)
    rca.summary = "Container restarting frequently — instability in the running image."
    return rca


_RULES = {
    "CrashLoopBackOff": _rule_crashloop,
    "OOMKilled": _rule_oom,
    "ImagePullBackOff": _rule_imagepull,
    "ErrImagePull": _rule_imagepull,
    "ProbeFailure": _rule_probe,
    "StuckRollout": _rule_stuck_rollout,
    "Unschedulable": _rule_unschedulable,
    "MissingLimits": _rule_missing_limits,
    "OverProvisioned": _rule_overprovisioned,
    "PrivilegedPod": _rule_privileged,
    "HighRestarts": _rule_high_restarts,
}


def deterministic_rca(ctx: IncidentContext) -> RCA:
    rule = _RULES.get(ctx.reason)
    if rule:
        return rule(ctx)
    return _mk(
        ctx,
        root_cause=f"Unclassified incident ({ctx.reason}) on {_target(ctx)}.",
        summary=f"{ctx.reason} on {ctx.name} — manual review recommended.",
        category="reliability",
        action="restart_pod",
        rationale="Restarting the pod clears transient faults; escalate if it recurs.",
        risk="low",
        mode="suggest",
        commands=[f"kubectl -n {ctx.namespace} delete pod {ctx.name}"],
        confidence=0.5,
    )


def _parse_rca(payload: dict | None, ctx: IncidentContext) -> RCA | None:
    if not payload or not isinstance(payload, dict) or "root_cause" not in payload:
        return None
    try:
        rem = payload.get("remediation") or {}
        risk = rem.get("risk") if rem.get("risk") in ("low", "medium", "high") else "low"
        mode = rem.get("mode") if rem.get("mode") in ("auto", "suggest") else "suggest"
        plan = RemediationPlan(
            action=str(rem.get("action") or "none"),
            target=str(rem.get("target") or _target(ctx)),
            rationale=str(rem.get("rationale") or ""),
            patch=rem.get("patch") if isinstance(rem.get("patch"), dict) else {},
            risk=risk,  # type: ignore[arg-type]
            mode=mode,  # type: ignore[arg-type]
            commands=[str(c) for c in (rem.get("commands") or [])][:8],
        )
        confidence = float(payload.get("confidence") or 0.6)
        confidence = max(0.0, min(1.0, confidence))
        evidence = [str(e) for e in (payload.get("evidence") or [])][:8] or _default_evidence(ctx)
        return RCA(
            root_cause=str(payload.get("root_cause") or "").strip() or "Root cause not determined.",
            summary=str(payload.get("summary") or "").strip() or "Incident diagnosed.",
            confidence=confidence,
            category=str(payload.get("category") or "reliability"),
            evidence=evidence,
            remediation=plan,
        )
    except Exception as exc:
        logger.warning("k8s_rca.parse_failed", error=str(exc))
        return None


async def diagnose(provider: AIProvider, ctx: IncidentContext) -> tuple[RCA, AIResult | None]:
    """
    Diagnose an incident. Returns (rca, ai_result|None). ``ai_result`` is None
    when the deterministic path was used (offline or LLM parse failure).
    """
    if getattr(provider, "name", "") != "offline":
        try:
            result = await provider.generate(
                diagnose_k8s_incident(ctx.model_dump()),
                system=K8S_SRE_SYSTEM,
                temperature=0.1,
                max_tokens=1200,
                json=True,
            )
            rca = _parse_rca(result.json_payload, ctx)
            if rca is not None:
                return rca, result
            logger.info("k8s_rca.llm_unparseable_using_deterministic")
        except Exception as exc:
            logger.warning("k8s_rca.llm_error_using_deterministic", error=str(exc))

    return deterministic_rca(ctx), None
