# DevForge — Continue From Here

A complete handoff document. Read top to bottom; the bottom half is the to-do list.

---

## What you're inheriting

A working monorepo for **DevForge** — the architecture-first IDE assistant
described in `README.md` and `context.md`. The previous session executed
**Phase 0** of the reconstruction plan and laid foundations for Phases 1–2.

Stack: pnpm workspaces · Turborepo · Next.js 15 (marketing) · FastAPI
(backend) · VS Code extension (TypeScript) · Rust CLI · AWS CDK (TypeScript).
Region target: **ap-south-1**.

---

## Repo layout

```
devforge/
├── apps/
│   ├── marketing/          ✅ Next.js 15 marketing site — builds, renders
│   └── extension/          ✅ Real VS Code extension — built, .vsix packageable
├── services/
│   ├── control-plane/      ✅ FastAPI backend — boots, 16 routes mounted
│   └── cli/                ✅ Rust CLI — `devforge wtf` wired to /v1/diagnose
├── packages/
│   ├── tokens/             ✅ Design tokens (colours, type, motion, Tailwind preset)
│   ├── ui/                 ✅ 10 branded React components
│   └── core/               🚧 EMPTY — folder exists for Phase 1 shared types/API client
├── infra/
│   └── cdk/                ✅ AWS CDK stack — synthesizes cleanly, NOT YET DEPLOYED
├── DEPLOY.md               📋 The deploy playbook — read this when you're ready to ship
├── README.md               📋 Project overview + architecture diagram
├── context.md              📋 Original product vision + enterprise pivot notes
└── continue.md             📋 This file
```

---

## Current state — what works, what doesn't

### ✅ Working & verified

- **`pnpm install`** clean (420 packages)
- **`pnpm --filter @devforge/marketing build`** → 64.5 kB route, 170 kB first-load JS
- **`pnpm --filter @devforge/marketing dev`** → ready in 1.8 s, renders correctly
- **`pnpm --filter devforge-vscode build`** → 16.5 kB extension bundle
- **`pnpm --filter devforge-vscode package`** → 32.76 kB `.vsix` (sitting at `apps/extension/devforge-vscode.vsix`)
- **Backend boots** via `uvicorn app.main:app` — 16 routes registered, `/health` returns 200 in 9 ms
- **Deterministic backend endpoints tested via curl:**
  - `POST /v1/security/scan` → finds hardcoded secrets, open SGs, public S3
  - `POST /v1/cost` → realistic AWS price estimates (RDS, EC2, S3 per-GB, etc.)
  - `POST /v1/patterns/detect` → catches nested loops + maps to LeetCode
- **CDK** typechecks + synthesizes a clean CloudFormation template
- **Typecheck passes** on all TS workspaces (tokens, ui, marketing, extension, cdk)

### 🚧 Wired but not yet exercised against live AWS

- **Bedrock-backed endpoints** (`/v1/analysis`, `/v1/drift`, `/v1/risk`, `/v1/blueprints/generate`, `/v1/mentor/chat`, `/v1/quiz/generate`, `/v1/diagnose`) — code is complete with retry + JSON extraction, untested because no Bedrock model invocation has happened yet (the AWS deploy is the blocker)
- **Auth** — currently API-key (`X-API-Key: dev-local-key`) + `X-Tenant-Id` header. Clerk/Cognito not yet wired. Multi-tenant middleware in place; expects a real JWT verifier as Phase 1 work.

### ❌ Not started

- **Postgres + SQLAlchemy** — `app/db/` and `app/models/` don't exist yet; blueprints are in-memory only
- **Redis caching** — config knob exists, no client
- **WebSocket fanout** — for live drift/cost updates to extension
- **CI/CD agent** (Phase 4) — GitHub App for autonomous PR fixes
- **K8s operator** (Phase 5)
- **Stripe billing**, audit log UI, dashboard web app

---

## Deploy state (the big one)

**Backend is NOT live on AWS yet.** All deploy artefacts exist but `cdk deploy`
was deferred because credentials weren't available in the previous session.

What's ready for you:
- `infra/cdk/lib/control-plane-stack.ts` — App Runner + ECR + IAM (Bedrock least-priv)
- `services/control-plane/Dockerfile` — multi-stage, non-root, healthcheck
- `DEPLOY.md` — step-by-step (sections 1.1 → 1.7) — total ~10 minutes once you have AWS creds

**Marketing site:** Not on Vercel yet. Builds locally. `DEPLOY.md` section 2 explains the Vercel setup (5 min).

**Extension:** `.vsix` is built. Install via `code --install-extension apps/extension/devforge-vscode.vsix`. Configure with `Ctrl+Shift+P → "DevForge: Set API URL"` once the backend is live.

---

## To run locally right now

```powershell
# 1. Backend (terminal 1)
cd D:\Forge\services\control-plane
.venv\Scripts\Activate.ps1            # venv already created in previous session
python -m uvicorn app.main:app --reload --port 8000
# → http://localhost:8000/docs

# 2. Marketing site (terminal 2)
cd D:\Forge
pnpm --filter @devforge/marketing dev
# → http://localhost:3000

# 3. Install extension (one-time)
cd D:\Forge\apps\extension
code --install-extension devforge-vscode.vsix

# 4. Smoke-test backend (terminal 3)
curl http://localhost:8000/health
curl -X POST http://localhost:8000/v1/security/scan `
  -H "Content-Type: application/json" `
  -H "X-Tenant-Id: local" `
  -d '{"scan_type":"code","target":{"content":"password = \"x\"","type":"terraform"}}'
```

---

## Bugs found and fixed in the previous session

These are documented so you know what was already debugged:

1. **`packages/tokens/src/tailwind-preset.ts`** — `as const` typography tokens
   conflicted with Tailwind's type expectations. Fixed via cast + `Object.fromEntries`
   string coercion. Watch out if you reorganise the token exports.

2. **`apps/marketing/src/app/globals.css`** — `@layer base` in the tokens package
   broke Tailwind compilation because `@tailwind base` lives in the consumer.
   Tokens CSS is now plain CSS (no `@layer`); utility helpers live in the
   marketing app's globals.

3. **`services/control-plane/app/routers/v1/cost.py`** — S3 cost always returned
   $0 because the price lookup built `s3:default` while the table key was
   `s3:standard`. Fixed: S3 is special-cased separately.

4. **`services/control-plane/app/routers/v1/security.py`** — IAM wildcard regex
   had six consecutive quotes that broke Python parsing. Switched to single-
   quoted r-string.

5. **`services/control-plane/app/main.py`** — removed deprecated `ORJSONResponse`
   (FastAPI now serializes via Pydantic directly).

---

## The 3-hour to-do for the next session

Ordered by priority. First three are the critical path.

### 1. **Actually deploy the backend to AWS** ⚡ (~15 min)

Read `DEPLOY.md` section 1 verbatim. You need:
- AWS CLI installed (`winget install Amazon.AWSCLI`)
- An IAM user with admin (or scoped IAM with App Runner + ECR + Bedrock perms)
- Bedrock Claude Sonnet 4 access granted in your AWS account/region
- Docker Desktop running (for the image build/push)

Then in order:
```powershell
aws configure                              # one-time
cd D:\Forge\infra\cdk
pnpm install
pnpm bootstrap                             # one-time per account/region
pnpm deploy                                # creates ECR + IAM + App Runner skeleton
# (App Runner will fail until image exists — that's expected)

# Build + push image
$ACCOUNT = (aws sts get-caller-identity --query Account --output text)
$REPO = "${ACCOUNT}.dkr.ecr.ap-south-1.amazonaws.com/devforge-control-plane"
aws ecr get-login-password --region ap-south-1 | docker login --username AWS --password-stdin $REPO
cd D:\Forge
docker build -t devforge-control-plane:latest services/control-plane
docker tag devforge-control-plane:latest "${REPO}:latest"
docker push "${REPO}:latest"

# Wait ~3 min for App Runner to redeploy, then:
curl https://<ServiceUrl-from-cdk-output>/health
```

If Bedrock isn't available in ap-south-1, change `bin/devforge.ts` line 22 to `us-east-1` or `us-west-2`.

### 2. **Deploy marketing site to Vercel** (~5 min)

`DEPLOY.md` section 2. Connect the GitHub repo, set root dir to `apps/marketing`,
override the build command to install at monorepo root first, set env vars
(`NEXT_PUBLIC_API_URL` = the App Runner URL from step 1).

### 3. **End-to-end smoke test** (~10 min)

- Install the extension: `code --install-extension apps/extension/devforge-vscode.vsix`
- `Ctrl+Shift+P → DevForge: Set API URL` → paste your App Runner URL
- Open any `.tf` file, write `password = "hunter2"` → save
- Confirm: red diagnostic appears + critical-gate modal pops + status bar shows finding count
- Open a Python file with `boto3.client('s3')` → save → status bar shows live cost estimate

If all three pass, you're shipped.

### 4. **Phase 1 backlog** (if you have time after the demo)

In priority order:
- **Postgres wiring**: add `app/db/session.py`, SQLAlchemy 2.0 async, Alembic for migrations, RLS policies. Models live at `app/models/`. The schemas in `app/schemas/` already exist — turn them into SQLAlchemy mappings.
- **Clerk JWT verification**: replace the `tenant_id` header lookup in `app/middleware/tenant.py` with real Clerk JWKS verification. Set `CLERK_*` env vars on App Runner.
- **Redis caching** on `/v1/analysis` and `/v1/risk` keyed by `sha256(code)` — saves Bedrock costs by ~70 % for hot files.

---

## Things to know before you touch the code

- **Don't `as const` Tailwind tokens.** See bug #1 above.
- **The `.claude/` folder is gitignored** but if a future session creates a `CLAUDE.md` (e.g. via `/init`), it goes IN the repo as project memory — that's intentional.
- **Don't commit `cdk.out/`** — it's gitignored. Each `cdk deploy` regenerates it.
- **Don't commit the `.vsix`** — also gitignored; the build step regenerates it.
- **Don't add an `icon: media/icon.png` field to the extension manifest** until you actually create the PNG. Marketplace requires it; local install doesn't.
- **Region** is `ap-south-1` everywhere. If you switch, update three places:
  `infra/cdk/bin/devforge.ts:22`, the Bedrock ARNs in
  `infra/cdk/lib/control-plane-stack.ts`, and `DEPLOY.md`.

---

## Quick reference

| What | Where |
|---|---|
| Deploy guide | `DEPLOY.md` |
| Architecture diagram | `README.md` (Mermaid) |
| Original product vision | `context.md` |
| Design tokens | `packages/tokens/src/` |
| UI components | `packages/ui/src/components/` |
| Marketing pages | `apps/marketing/src/app/page.tsx` + `components/sections/` |
| Backend routes | `services/control-plane/app/routers/v1/` |
| AI prompts | `services/control-plane/app/services/prompts.py` |
| Extension entry | `apps/extension/src/extension.ts` |
| CDK stack | `infra/cdk/lib/control-plane-stack.ts` |
| CLI entry | `services/cli/src/main.rs` |

---

**Open questions for the next session**

- Decide Clerk vs Cognito for auth (lean Clerk; faster integration).
- Do we ship a `apps/dashboard` (auth'd web app) in Phase 4 or keep all dashboard surfaces in the extension?
- Kiro extension parity — VS Code extension API is mostly compatible. Test on Kiro early and surface any Kiro-only quirks.

Good luck. Read `DEPLOY.md` first.
