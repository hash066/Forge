# syntax=docker/dockerfile:1.7
# DevForge Control Plane — production image.
#
# Multi-stage: builder installs deps into a venv, runtime copies the venv +
# app code into a slim base. Final image ~120MB.

# ── Builder ───────────────────────────────────────────────────────────────
FROM python:3.12-slim AS builder

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_DISABLE_PIP_VERSION_CHECK=1 \
    PIP_NO_CACHE_DIR=1

WORKDIR /build

# Install build deps for any C extensions (asyncpg, cryptography, etc.)
RUN apt-get update \
 && apt-get install -y --no-install-recommends gcc build-essential \
 && rm -rf /var/lib/apt/lists/*

COPY pyproject.toml ./
RUN pip install --upgrade pip \
 && pip install --target /install \
    "fastapi>=0.115" "uvicorn[standard]>=0.34" \
    "pydantic>=2.10" "pydantic-settings>=2.7" \
    "httpx>=0.28" "boto3>=1.35" \
    "structlog>=24.4" "orjson>=3.10" \
    "tenacity>=9.0" "anyio>=4.0" \
    "python-multipart>=0.0.20"

# ── Runtime ───────────────────────────────────────────────────────────────
FROM python:3.12-slim AS runtime

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PYTHONPATH=/app:/app/deps \
    APP_ENV=production \
    PORT=8000

RUN groupadd --gid 1000 devforge \
 && useradd --uid 1000 --gid devforge --shell /usr/sbin/nologin --create-home devforge

WORKDIR /app

COPY --from=builder /install /app/deps
COPY --chown=devforge:devforge app /app/app

USER devforge
EXPOSE 8000

# App Runner / ECS health check
HEALTHCHECK --interval=15s --timeout=4s --start-period=10s --retries=3 \
    CMD python -c "import urllib.request; urllib.request.urlopen('http://127.0.0.1:8000/health', timeout=3)" || exit 1

CMD ["python", "-m", "uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000", "--proxy-headers", "--forwarded-allow-ips=*"]
