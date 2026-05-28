# DevForge OS — Continue From Here

Handoff for the next session. DevForge was rebuilt into **DevForge OS — an autonomous
AI SRE for Kubernetes** for the Outskill × OpenAI hackathon. Read `README.md` first,
then this.

---

## What it is now

An in-cluster **operator** detects Kubernetes incidents → the **control plane** diagnoses
each with **OpenAI GPT** → the operator **remediates** under a `RemediationPolicy` (auto vs
approve) → a live **dashboard** streams the whole self-healing loop. Multi-tenant, audited,
policy-gated.

## What's DONE and verified (this session)

- **AI provider abstraction** — OpenAI default (`gpt-5.5`), Bedrock + offline swappable, graceful
  fallback. All existing routers repointed off the old Bedrock client. (`app/services/ai/`)
- **Persistence** — async SQLAlchemy + 5 tenant-scoped models + Alembic migration + SQLite default.
- **K8s control-plane brain** — `/v1/k8s/diagnose|remediate|snapshot|incidents|overview|audit` +
  `WS /v1/k8s/stream`. RCA engine with LLM path **and** a rich deterministic fallback.
- **Operator** (`operators/k8s`) — kopf handlers (live), pure detectors (9 unit tests pass),
  remediator, **simulator** (`--sim`, no cluster), `RemediationPolicy` CRD, least-priv RBAC, Dockerfile.
- **packages/core** — shared TS types + typed REST/WebSocket client (was empty).
- **Dashboard** (`apps/dashboard`) — Next.js 15 live command center. Built, runs, **screenshot-verified**
  showing live incidents → AI root cause → remediation → heal. Has a one-click "Run live demo".
- **Demo harness** (`demo/`) — `run-local` + `sim` (no cluster, tested end-to-end) + `up`/`down` (kind)
  + broken workloads + talk track.
- **Helm chart** (`deploy/helm/devforge-os`) + raw manifests + EKS guide. All YAML validated.
- **VS Code extension** — "Cluster Incidents" tree view (live), builds to .vsix.
- **Rust CLI** — `devforge cluster status|watch|incidents` (written; not compiled — no cargo here).
- **Marketing** — repositioned to the self-healing-K8s + OpenAI story (hero, features, how-it-works,
  modes→co-pilot/autopilot, tech-stack, CTA). Builds clean.
- **Infra/CDK** — App Runner control plane now wires `AI_PROVIDER`/`OPENAI_MODEL`/`OPENAI_API_KEY`. Synths clean.
- **Tests/quality** — backend `pytest` 24 passed (~70% cov), operator `pytest` 9 passed, `ruff` clean,
  all TS workspaces typecheck, dashboard + marketing build.

## Run it right now

```powershell
# 1. control plane
cd D:\Forge\services\control-plane; .venv\Scripts\Activate.ps1
python -m uvicorn app.main:app --reload --port 8000
# 2. dashboard  → http://localhost:3001
cd D:\Forge; pnpm --filter @devforge/dashboard dev
# 3. drive the heal loop (or click "Run live demo" in the dashboard)
cd D:\Forge; ./demo/sim.ps1 -Loop
```

## YOUR manual steps (only these remain)

1. **OpenAI key (1 min, optional but recommended):** put `OPENAI_API_KEY=sk-...` in
   `services/control-plane/.env`. Without it the deterministic engine runs an identical demo.
2. **Live kind cluster (optional):** install Docker Desktop + kind + helm, then `./demo/up.sh`.
   (This build env had no Docker/kind, so the live-cluster path is unrun — the **sim path is fully tested**.)
3. **Compile the Rust CLI (optional):** `cd services/cli && cargo build --release` (no cargo in build env).
4. **Cloud (optional):** App Runner via `infra/cdk` (see `DEPLOY.md`), or EKS via `deploy/eks`.
5. **Push to GitHub:** see below.

## Push to GitHub (hash066/Forge)

`gh` is authed as **hash066** (active). Use the gh credential helper to avoid the TheClazer mismatch:

```bash
git add -A && git commit -m "feat: DevForge OS — autonomous AI SRE for Kubernetes"
git -c credential.helper= -c "credential.helper=!gh auth git-credential" push origin main
```

## Architecture cheat-sheet

- AI seam: `app/services/ai/factory.py::get_ai_provider()` → returns OpenAI/Bedrock/offline provider.
- RCA: `app/services/k8s_rca.py` — `diagnose(provider, ctx)` tries LLM, falls back to `deterministic_rca`.
- Live events: `app/services/eventbus.py` → `WS /v1/k8s/stream` → dashboard `useClusterFeed` hook.
- Operator detectors: `operators/k8s/devforge_operator/detectors.py` (`scan_pod`, `scan_deployment_rollout`).
- Dashboard data: `apps/dashboard/src/hooks/useClusterFeed.ts` (+ `runDemo` self-drives via the core client).

## Gotchas / decisions (don't re-discover these)

- **Windows console + Unicode**: set `PYTHONUTF8=1` when running Python that prints em-dashes/arrows.
- **Two SQLite files if you run two control planes** — they share `./devforge.db` by cwd; use a separate
  `DATABASE_URL` (e.g. `demo.db`) or stop the other instance (the `rm devforge.db` fails on a file lock).
- **Dashboard timestamps** treat tz-naive backend times as UTC (see `lib/format.ts::timeAgo`).
- **Ruff** is configured for the FastAPI/SQLAlchemy stack (Depends whitelist, lazy-import allowance,
  line-length 120). Keep it green.
- The old plan file: `C:\Users\Rayyan Shaikh\.claude\plans\reconstruct-everything-from-the-delightful-llama.md`.

## If you have more time (highest leverage next)

1. Set `OPENAI_API_KEY` and run the sim — confirm the LLM RCA path produces richer diagnoses than the
   deterministic fallback (provider badge in the dashboard flips to `OpenAI · gpt-5.5`).
2. Run `./demo/up.sh` on a machine with Docker/kind and validate the live operator end-to-end; capture a GIF.
3. Wire Clerk JWT in `app/middleware/tenant.py` (replace the `X-Tenant-Id`/`anonymous` default).
4. Add Redis caching of RCA by incident signature to cut OpenAI cost/latency on repeats.

Good luck. The demo always works offline — lead with `./demo/sim` + the dashboard.
