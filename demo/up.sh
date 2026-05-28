#!/usr/bin/env bash
# DevForge OS — full LIVE demo on a local kind cluster.
# Requires: docker, kind, kubectl. Set OPENAI_API_KEY for real GPT diagnoses.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
CLUSTER=devforge

echo "==> Creating kind cluster '$CLUSTER'"
if ! kind get clusters | grep -q "^${CLUSTER}$"; then
  kind create cluster --config "$ROOT/demo/kind-config.yaml"
fi

echo "==> Building images"
docker build -t devforge/control-plane:latest "$ROOT/services/control-plane"
docker build -t devforge/operator:latest "$ROOT/operators/k8s"

echo "==> Loading images into kind"
kind load docker-image devforge/control-plane:latest --name "$CLUSTER"
kind load docker-image devforge/operator:latest --name "$CLUSTER"

echo "==> Deploying control plane"
kubectl apply -f "$ROOT/deploy/manifests/control-plane.yaml"
if [ -n "${OPENAI_API_KEY:-}" ]; then
  echo "    (wiring OPENAI_API_KEY secret)"
  kubectl -n devforge-system create secret generic devforge-secrets \
    --from-literal=OPENAI_API_KEY="$OPENAI_API_KEY" --dry-run=client -o yaml | kubectl apply -f -
  kubectl -n devforge-system rollout restart deploy/devforge-control-plane
fi

echo "==> Deploying operator (CRD, RBAC, policy, deployment)"
kubectl apply -f "$ROOT/operators/k8s/manifests/crd.yaml"
kubectl apply -f "$ROOT/operators/k8s/manifests/rbac.yaml"
kubectl apply -f "$ROOT/operators/k8s/manifests/operator.yaml"

echo "==> Deploying deliberately-broken workloads"
kubectl apply -f "$ROOT/demo/workloads.yaml"

cat <<'EOF'

✅ Cluster is up. Two more terminals:
  1) kubectl -n devforge-system port-forward svc/devforge-control-plane 8000:8000
  2) pnpm --filter @devforge/dashboard dev      # http://localhost:3001

Watch the heal:  kubectl get pods -A -w
Tear down:       demo/down.sh
EOF
