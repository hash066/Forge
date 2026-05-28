#!/usr/bin/env bash
# DevForge OS — one-command LOCAL demo (no cluster, no Docker).
# Launches control plane (:8000) + dashboard (:3001), then drives a looping
# detect -> diagnose -> heal cycle. Set OPENAI_API_KEY for real GPT diagnoses.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"

cleanup() { kill "${CP_PID:-}" "${DASH_PID:-}" 2>/dev/null || true; }
trap cleanup EXIT INT TERM

echo "==> Starting control plane on :8000"
(
  cd "$ROOT/services/control-plane"
  if [ -f .venv/bin/activate ]; then source .venv/bin/activate; fi
  PYTHONUTF8=1 python -m uvicorn app.main:app --port 8000
) &
CP_PID=$!

sleep 3
echo "==> Starting dashboard on :3001"
( cd "$ROOT" && pnpm --filter '@devforge/dashboard' dev ) &
DASH_PID=$!

echo "==> Waiting for services..."
sleep 9
echo "==> Open http://localhost:3001"

echo "==> Driving the self-healing demo (Ctrl+C to stop)"
DEVFORGE_CONTROL_PLANE_URL="http://localhost:8000" bash "$ROOT/demo/sim.sh" --loop
