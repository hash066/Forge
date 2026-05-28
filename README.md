<div align="center">

# DevForge OS

### The autonomous AI SRE for Kubernetes.

**It watches your cluster, diagnoses every incident with GPT, and remediates it automatically — with policy gates and a full audit trail.**

Crash loops · OOM kills · bad rollouts · unschedulable pods · cost waste · security misconfig
→ detected, root-caused by OpenAI, and healed before the pager fires.

*Built for the Outskill × OpenAI AI Builders Hackathon — powered by OpenAI, shipped with Codex.*

</div>

---

## Why

At 3am a pod starts crash-looping. Today: a human gets paged, greps logs, guesses the cause, and applies a fix from memory. DevForge OS collapses that loop into seconds — an in-cluster operator detects the fault, hands full context to **OpenAI GPT** for a real root-cause analysis, and applies the least-invasive fix (rollback, resource bump, image pin, probe tweak) under a policy you control. Every action streams to a live dashboard and an immutable audit log.

It's **agentic** (it acts, not just alerts), **safe** (policy-gated, least-privilege RBAC, full audit), and **real** (a kopf operator + FastAPI control plane + Helm chart you can install today).

## Try it in 60 seconds — no cluster, no Docker

```bash
pnpm install
# terminal 1 — the AI control plane
cd services/control-plane && python -m venv .venv && . .venv/Scripts/activate   # (bash: . .venv/bin/activate)
pip install -e . && uvicorn app.main:app --port 8000
# terminal 2 — the dashboard
pnpm --filter @devforge/dashboard dev          # → http://localhost:3001
# terminal 3 — drive a full detect → diagnose → heal cycle
./demo/sim.sh --loop                            # (Windows: ./demo/sim.ps1 -Loop)
```

Open **http://localhost:3001** and click **“Run live demo.”** Watch six workloads fail, get
diagnosed by the SRE engine, and heal as cluster health climbs back to 100% — live over WebSocket.

> Set `OPENAI_API_KEY` in `services/control-plane/.env` for real GPT-5.5 diagnoses. Without a key,
> a deterministic SRE rule-engine drives an identical demo — so it **never** fails on stage.

**Real cluster?** `./demo/up.sh` spins up a kind cluster with broken workloads and the operator. **Production?** `helm install devforge-os ./deploy/helm/devforge-os` (see [`deploy/eks`](deploy/eks)).

## Architecture

```
 Kubernetes cluster (kind / EKS)              ── or ──   Simulation (no cluster)
 ┌──────────────────────────────┐
 │ DevForge Operator (kopf)      │  watch   ┌──────────────┐
 │  • deterministic detectors    │ ───────► │  K8s API      │
 │  • RemediationPolicy CRD      │ ◄─────── │  pods/events  │
 │  • applies fixes (RBAC)       │  patch   └──────────────┘
 └───────────────┬──────────────┘
                 │ incident context (HTTPS)
                 ▼
 ┌─────────────────────────────────────────────────────────┐
 │ Control Plane (FastAPI)                                   │
 │  AI provider abstraction → OpenAI GPT-5.5 (default)      │
 │  RCA engine · policy gates · audit · multi-tenant        │
 │  SQLite/Postgres · WebSocket fan-out                     │
 └───────────────┬─────────────────────────────────────────┘
                 │ REST + WebSocket
                 ▼
 ┌─────────────────────────────────────────────────────────┐
 │ Dashboard (Next.js)  ·  VS Code extension  ·  Rust CLI    │
 └─────────────────────────────────────────────────────────┘
```

## How it works

1. **Detect** — pure-function detectors classify faults from the K8s API: `CrashLoopBackOff`, `OOMKilled`, `ImagePullBackOff`, `ProbeFailure`, `StuckRollout`, `Unschedulable`, `MissingLimits`, `OverProvisioned`, `PrivilegedPod`.
2. **Diagnose** — the operator gathers context (events, logs, container status, spec) and the control plane asks **OpenAI** for a structured root cause + remediation with a confidence score. A deterministic engine is the always-on fallback.
3. **Remediate** — per the `RemediationPolicy` CRD, low-risk fixes auto-apply; risky ones wait for one-click approval. Every action is audited.
4. **Observe** — a live dashboard streams incidents, diagnoses, fixes, cost, and security posture in real time.

## Repository layout

```
apps/
  dashboard/       Next.js 15 — live self-healing command center (the showpiece)
  marketing/       Next.js 15 — product site
  extension/       VS Code extension — cluster incidents in your IDE
operators/
  k8s/             Python kopf operator — detectors, remediator, simulator, CRD, RBAC
services/
  control-plane/   FastAPI — AI RCA engine, persistence, WebSocket, audit, multi-tenant
  cli/             Rust CLI — `devforge cluster status|watch|incidents`
packages/
  core/            Shared TS types + typed REST/WebSocket client
  ui/ · tokens/    Branded design system (coral/dark/glass)
deploy/
  helm/devforge-os Helm chart (operator + control plane + CRD + RBAC)
  manifests/ eks/  Raw manifests + EKS guide
infra/cdk/         AWS CDK — control plane on App Runner (OpenAI-wired)
demo/              One-command local + kind demos, broken workloads, talk track
```

## Tech stack

| Layer | Stack |
| --- | --- |
| AI | **OpenAI GPT-5.5** behind a provider abstraction (Bedrock/offline swappable) |
| Operator | Python · **kopf** · kubernetes client · `RemediationPolicy` CRD · least-priv RBAC |
| Control plane | FastAPI · Pydantic v2 · async SQLAlchemy · Alembic · WebSocket |
| Data | SQLite (zero-setup) / Postgres · immutable audit log · multi-tenant |
| Dashboard | Next.js 15 · React 19 · Tailwind · Framer Motion |
| CLI | Rust · clap · tokio · reqwest |
| Infra | Helm · kind / EKS · AWS App Runner + CDK · Docker |

## Verify it

```bash
# Backend: 24 tests (providers, RCA engine, full API, tenant isolation)
cd services/control-plane && pytest
# Operator: 9 detector tests (no cluster needed)
cd operators/k8s && pytest
# Workspace typecheck + builds
pnpm -r typecheck && pnpm --filter @devforge/dashboard build
```

## Built with OpenAI

DevForge OS runs on the OpenAI API (GPT-5.5) for incident diagnosis, and was built with
**OpenAI Codex** as the coding agent. The AI layer is a clean provider interface, so the
product is OpenAI-first while remaining multi-model for enterprise buyers.

## License

UNLICENSED — proprietary work in progress.
