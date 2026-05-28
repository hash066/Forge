#!/usr/bin/env bash
# DevForge OS — cluster-free demo (no Docker/kind needed).
# Replays broken-pod fixtures through the real detector pipeline and drives the
# control plane through a full detect -> diagnose -> heal cycle.
set -euo pipefail

export DEVFORGE_CONTROL_PLANE_URL="${DEVFORGE_CONTROL_PLANE_URL:-http://localhost:8000}"
export DEVFORGE_TENANT_ID="${DEVFORGE_TENANT_ID:-demo}"
export PYTHONUTF8=1

cd "$(dirname "$0")/../operators/k8s"
echo "DevForge OS simulator -> $DEVFORGE_CONTROL_PLANE_URL"
exec python -m devforge_operator.simulator "$@"
