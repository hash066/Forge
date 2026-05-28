# DevForge OS operator — runs the kopf controller in-cluster.
FROM python:3.12-slim AS base

ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PIP_NO_CACHE_DIR=1

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY devforge_operator ./devforge_operator

# Run as non-root
RUN useradd --create-home --uid 10001 devforge
USER devforge

# kopf runs the controller; handlers live in devforge_operator/main.py
ENTRYPOINT ["kopf", "run", "--standalone", "-m", "devforge_operator.main"]
