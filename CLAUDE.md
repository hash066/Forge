# DevForge OS — Project Memory

## What this is

**DevForge OS is an autonomous AI SRE for Kubernetes.** An in-cluster operator detects
incidents (CrashLoopBackOff, OOMKilled, ImagePullBackOff, bad rollouts, unschedulable pods,
cost waste, security misconfig), the control plane diagnoses each with **OpenAI GPT**, and the
operator remediates it — under a `RemediationPolicy` CRD, with least-privilege RBAC and a full
audit trail. Built for the **Outskill × OpenAI hackathon** (shipping competition; OpenAI/Codex).

> History: this repo began as an architecture-first IDE assistant ("DevForge"). It was pivoted
> into **DevForge OS** (self-healing Kubernetes). The old IDE analysis endpoints (analysis, drift,
> risk, cost, security, mentor, quiz, blueprints, diagnose, patterns, scale) still exist and work,
> but the **product is the K8s self-healing loop**.

The showpiece is the **dashboard** (`apps/dashboard`). The **operator** (`operators/k8s`) is the
agent. The **control plane** (`services/control-plane`) is the AI brain. Marketing sells it; the
VS Code extension + Rust CLI are sidecars.

## Monorepo layout

```
apps/
  dashboard/       Next.js 15 — live self-healing command center (THE demo)
  marketing/       Next.js 15 — product site (repositioned to DevForge OS)
  extension/       VS Code extension — "Cluster Incidents" tree + existing analysis
services/
  control-plane/   FastAPI — AI RCA engine, persistence, WebSocket, audit, multi-tenant
  cli/             Rust CLI — `devforge cluster status|watch|incidents` + `wtf`
operators/
  k8s/             Python kopf operator — detectors, remediator, simulator, CRD, RBAC
packages/
  core/            Shared TS types + typed REST/WebSocket client (was empty; now filled)
  ui/ tokens/      "Obsidian & Champagne" design system — warm obsidian + ivory + champagne
                   gold; Fraunces (serif display) · Hanken Grotesk (UI) · JetBrains Mono
deploy/
  helm/devforge-os Helm chart · manifests/ raw k8s · eks/ EKS guide
infra/cdk/         AWS CDK — control plane on App Runner (OpenAI env wired)
demo/              run-local + up(kind) + sim scripts, broken workloads, talk track
```

## Key architecture

- **AI provider abstraction** (`app/services/ai/`): `base.py` (Protocol + `AIResult` + `extract_json`),
  `openai_provider.py` (default, defensive about model param variance), `bedrock_provider.py`,
  `offline_provider.py` (deterministic), `factory.py` (`get_ai_provider()`, degrades to offline).
  All routers call `get_ai_provider().generate(...)`, never a concrete SDK.
- **K8s brain**: `app/routers/v1/k8s.py` (diagnose/remediate/snapshot/incidents/overview/audit + `WS /stream`),
  `app/services/k8s_rca.py` (LLM path + rich deterministic rule table keyed by reason),
  `app/services/eventbus.py` (in-proc pub/sub → WebSocket fan-out).
- **Persistence**: async SQLAlchemy in `app/db/` + `app/models/` (Tenant, Incident, Remediation,
  ClusterSnapshot, AuditLog — all `tenant_id`-scoped). SQLite default; Postgres via `DATABASE_URL`.
  Alembic configured (`alembic upgrade head`); `init_db()` create_all runs on boot for SQLite.
- **Operator**: `operators/k8s/devforge_operator/` — `detectors.py` (pure functions, unit-tested),
  `main.py` (kopf handlers, live mode), `simulator.py` (`--sim`/replay, no cluster), `remediator.py`
  (applies fixes via K8s API). Detectors are the testable core; the simulator drives the demo.

## Running locally

```powershell
# Control plane (terminal 1)
cd services/control-plane && .venv\Scripts\Activate.ps1
python -m uvicorn app.main:app --reload --port 8000

# Dashboard (terminal 2)  → http://localhost:3001
pnpm --filter @devforge/dashboard dev

# Drive the demo (terminal 3) — or click "Run live demo" in the dashboard
./demo/sim.ps1 -Loop
```

The control plane venv is at `services/control-plane/.venv` (Python 3.11). Use it directly:
`D:/Forge/services/control-plane/.venv/Scripts/python.exe`.

## Verification (all green)

- `cd services/control-plane && pytest` → 24 passed (providers, RCA, full API, tenant isolation), ~70% cov.
- `cd operators/k8s && pytest` → 9 detector tests pass.
- `pnpm -r typecheck` → all TS workspaces clean (CLI needs cargo; control-plane uses ruff/pytest).
- `ruff check app` → clean. `pnpm --filter @devforge/dashboard build` + marketing build → clean.

## Key conventions

- **AI is OpenAI-first** via the provider abstraction. Default model `gpt-5.5` (configurable via
  `OPENAI_MODEL`). No key → factory falls back to the offline deterministic engine (demo still works).
- **Never `as const` Tailwind token tuples** — see `packages/tokens/src/tailwind-preset.ts`.
- **Tokens CSS has no `@layer`** — plain `:root {}`; `@layer utilities` live in each app's globals.css.
- **Region is ap-south-1** for AWS bits (CDK, Bedrock fallback).
- **Dashboard timestamps**: backend returns tz-naive UTC; the dashboard's `timeAgo` appends `Z` so
  local-timezone clients don't skew. Don't "fix" by changing one side only.
- **Ruff line-length is 120**; FastAPI `Depends()` defaults are whitelisted (not B008); lazy imports
  (`PLC0415`) are intentional for optional SDKs.

## What's NOT done (manual / future)

- **OPENAI_API_KEY** is not set — add it to `services/control-plane/.env` for live GPT (offline works without).
- **Live cluster / images / cloud deploy** — user runs (`demo/up.sh`, Helm, EKS, CDK). No Docker/kind/cargo in the build env.
- Clerk JWT auth (middleware defaults tenant to `X-Tenant-Id` header or `anonymous`).
- Redis caching, Stripe billing, GitHub CI/CD agent.
