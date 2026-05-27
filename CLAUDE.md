# DevForge — Project Memory

## What this is

DevForge is an **architecture-first IDE assistant** — a VS Code/Kiro extension backed by a FastAPI control plane on AWS. It analyzes code in real time: drift detection, risk scoring, cost estimation, security scanning, AI mentor chat, and pattern detection. Enterprise multi-tenant SaaS target.

Primary surface is the **extension**. The marketing site (`apps/marketing`) sells it. The Rust CLI (`services/cli`) is a sidecar. The backend (`services/control-plane`) is the AI brain.

## Monorepo layout

```
apps/
  marketing/       Next.js 15 App Router — builds, deploys to Vercel
  extension/       Real VS Code extension — built, .vsix packageable
services/
  control-plane/   FastAPI backend — 16 routes, boots on :8000
  cli/             Rust CLI — `devforge wtf` wired to /v1/diagnose
packages/
  tokens/          Design tokens (HSL CSS vars, Tailwind preset)
  ui/              10 branded React components
  core/            EMPTY — Phase 1 shared types/API client
infra/
  cdk/             AWS CDK (TypeScript) — App Runner + ECR + IAM
```

## Stack

| Layer | Tech |
|---|---|
| Marketing | Next.js 15, Tailwind, Framer Motion, Vercel |
| Design system | Tailwind + tokens, shadcn primitives |
| Extension | TypeScript, real VS Code Extension API, esbuild |
| Backend | FastAPI (Python 3.12), Pydantic v2, async boto3 |
| AI | Amazon Bedrock — Claude Sonnet 4 |
| Infra | AWS CDK → App Runner (ap-south-1) |
| CLI | Rust, clap + tokio + reqwest |

## Running locally

```powershell
# Backend
cd services/control-plane && .venv\Scripts\Activate.ps1
python -m uvicorn app.main:app --reload --port 8000

# Marketing
pnpm --filter @devforge/marketing dev   # → localhost:3000

# Extension
cd apps/extension && pnpm build && pnpm package
code --install-extension devforge-vscode.vsix
```

## Key conventions

- **Never `as const` Tailwind token tuples** — Tailwind's type expectations conflict; use `as unknown as ...` cast or `Object.fromEntries` string coercion. See `packages/tokens/src/tailwind-preset.ts`.
- **Tokens CSS has no `@layer`** — the `@layer base` wrapper broke Next.js compilation; tokens CSS is plain `:root {}` blocks. `@layer utilities` helpers live in the consumer's globals.
- **Region is ap-south-1 everywhere** — if you change it, update `infra/cdk/bin/devforge.ts:22`, the Bedrock ARNs in the CDK stack, and `DEPLOY.md`.
- **API key auth now** — `X-API-Key: dev-local-key` + `X-Tenant-Id` header. Clerk/Cognito not yet wired.
- **Bedrock endpoints are complete but untested live** — code is solid, waiting on AWS deploy.
- **No Postgres yet** — blueprints are in-memory. `app/db/` and `app/models/` don't exist yet.

## Deploy state

Backend is NOT live on AWS. All artefacts are ready:
- CDK stack synthesizes cleanly (`pnpm --filter @devforge/infra-cdk synth`)
- Dockerfile is production-ready (multi-stage, non-root, healthcheck)
- Full deploy playbook in `DEPLOY.md`

Next step: `aws configure` → `pnpm bootstrap` → `pnpm deploy` (from `infra/cdk/`) → docker build + push → wait for App Runner.

## Phase status

- **Phase 0 (Foundation)**: ✅ Complete — monorepo, tokens, UI, extension, backend, CDK, CLI
- **Phase 1 (Marketing + Backend Core)**: 🚧 Backend done; Postgres/auth/Redis not wired; marketing site not on Vercel
- **Phase 2 (Extension MVP)**: 🚧 Extension builds and packages; webview is static HTML (no React webview)
- **Phase 3+ (Enterprise)**: ❌ Not started

## What's NOT started yet

- `packages/core/` — empty folder
- Postgres + SQLAlchemy (`app/db/`, `app/models/`)
- Redis caching
- Clerk/Cognito auth
- WebSocket fanout for live updates
- React webviews in extension (current webview is plain HTML)
- Stripe billing, audit log UI, dashboard app
