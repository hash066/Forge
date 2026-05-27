# DevForge

> Architecture-first AI for engineers who ship.
>
> Real-time drift detection, AWS cost guardrails, security gates, and a mentor that asks
> the right questions — packaged as an IDE extension, a CLI, and an enterprise control plane.

## Repository layout

```
devforge/
├── apps/
│   ├── marketing/          # Next.js 15 marketing site — devforge.io
│   ├── extension/          # VS Code + Kiro extension (Phase 2)
│   └── dashboard/          # Authenticated web dashboard (Phase 4)
├── services/
│   ├── control-plane/      # FastAPI backend (multi-tenant, Bedrock-powered)
│   ├── cli/                # Rust CLI — `devforge wtf` & friends
│   └── cicd-agent/         # GitHub App / GitLab webhook receiver (Phase 4)
├── packages/
│   ├── tokens/             # Design tokens — colors, typography, motion, spacing
│   ├── ui/                 # Shared React component library (branded + shadcn)
│   └── core/               # Shared TS types + API client (Phase 1)
├── infra/
│   └── cdk/                # AWS CDK — single source of truth for cloud infra
├── docs/                   # MDX docs (rendered into marketing site)
└── operators/              # K8s operator — Phase 5
```

## Quick start

```bash
# 1. Install pnpm via corepack (one-time)
corepack enable
corepack prepare pnpm@9.15.0 --activate

# 2. Install dependencies (workspaces)
pnpm install

# 3. Marketing site
pnpm --filter @devforge/marketing dev
# → http://localhost:3000

# 4. Backend (separate terminal, Python 3.12+)
cd services/control-plane
python -m venv .venv && . .venv/bin/activate
pip install -e ".[dev]"
cp .env.example .env
uvicorn app.main:app --reload
# → http://localhost:8000/docs

# 5. CLI (Rust toolchain required)
cd services/cli
cargo run -- --help
cargo run -- health
```

## Tech stack

| Layer | Stack |
| --- | --- |
| Marketing | Next.js 15 · React 19 · Tailwind · Framer Motion · Vercel |
| Design system | Custom tokens · shadcn primitives · Geist + JetBrains Mono |
| Extension | TypeScript · VS Code Extension API · webview React |
| Backend | FastAPI · Pydantic v2 · Async SQLAlchemy · Alembic |
| AI | Amazon Bedrock (Claude Sonnet 4) · versioned prompts |
| Data | Postgres (Aurora Serverless v2) with RLS · Redis · S3 |
| CLI | Rust · clap · tokio · reqwest |
| Infra | AWS CDK · Fargate · API Gateway · CloudWatch |

## Status

See `.claude/plans/reconstruct-everything-from-the-delightful-llama.md` for the full
phased plan. We are currently at the end of **Phase 0** (foundation) — monorepo
scaffold, design system, marketing site, and backend control plane are in place.
Phase 1 wires auth + Postgres + production deploy.

## Concept

Engineers ship faster than ever, but architectural literacy hasn't kept up. DevForge is
the IDE extension that holds you to your own design — every keystroke compared against
an approved blueprint, every AWS resource costed before it ships, every security
violation gated before commit. It's an enterprise-grade product designed for engineers
who measure twice and cut once, with a Student Mode that teaches the same instincts to
the next generation.

## License

UNLICENSED — proprietary work in progress.
