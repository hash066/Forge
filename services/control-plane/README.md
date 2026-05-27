# DevForge Control Plane

FastAPI backend — the central AI brain for DevForge. Multi-tenant from line one, Bedrock-powered, deployed to AWS Fargate.

## What's in here

```
app/
├── main.py                # FastAPI app factory + lifespan
├── config.py              # Pydantic settings (env-driven)
├── deps.py                # Tenant context, auth guards
├── middleware/
│   ├── tenant.py          # Resolves tenant per request
│   └── audit.py           # Structured audit log of mutations
├── routers/
│   ├── health.py          # /health
│   └── v1/
│       ├── auth.py        # /v1/auth/session, /v1/auth/ready
│       ├── blueprints.py  # /v1/blueprints/generate, GET/:id, GET
│       ├── analysis.py    # /v1/analysis        — Bedrock-powered
│       ├── drift.py       # /v1/drift           — Bedrock-powered
│       ├── risk.py        # /v1/risk            — Bedrock-powered
│       ├── cost.py        # /v1/cost            — deterministic pricing table
│       ├── mentor.py      # /v1/mentor/chat     — Bedrock chat
│       ├── quiz.py        # /v1/quiz/generate   — Bedrock student-mode quiz
│       ├── scale.py       # /v1/scale/predict   — capacity model
│       ├── security.py    # /v1/security/scan   — regex rule engine
│       ├── patterns.py    # /v1/patterns/detect — LeetCode mapping
│       └── diagnose.py    # /v1/diagnose        — CLI `devforge wtf`
├── schemas/
│   ├── common.py          # Shared Pydantic types (RiskScores, Violation, ...)
│   └── analysis.py        # Analysis-domain shapes
└── services/
    ├── bedrock.py         # Async-friendly Bedrock client with retries
    └── prompts.py         # Versioned prompt registry
```

## Running locally

```bash
# 1. Create a virtualenv and install deps
python -m venv .venv
. .venv/bin/activate      # Linux / macOS
.venv\Scripts\activate    # Windows PowerShell
pip install -e ".[dev]"

# 2. Copy env file and set AWS creds (Bedrock access required)
cp .env.example .env

# 3. Run the server
uvicorn app.main:app --reload
```

Open <http://localhost:8000/docs> for interactive OpenAPI.

## Testing

```bash
pytest
ruff check app tests
mypy app
```

## Auth

Three modes:

- **Public** (`/`, `/health`, `/docs`) — no auth.
- **Tenant scoped** (most `/v1/*`) — requires `X-Tenant-Id` header in dev; Clerk JWT in production (Phase 1).
- **Internal** (`/v1/diagnose` and any service-to-service endpoint) — requires `X-API-Key`. Default dev key is `dev-local-key`; rotate via AWS Secrets Manager in production.

## What's intentionally NOT here yet

- Postgres / SQLAlchemy models — Phase 1 (blueprints currently live in-memory)
- Clerk JWT verification — Phase 1
- Redis caching layer — Phase 1
- WebSocket fanout — Phase 2 (for live drift/cost updates to the extension)
- CI/CD agent — Phase 4
- K8s operator — Phase 5

See the top-level reconstruction plan for the phased roadmap.
