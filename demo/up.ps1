# DevForge OS — full LIVE demo on a local kind cluster.
# Requires: docker, kind, kubectl. Set $env:OPENAI_API_KEY for real GPT diagnoses.
$ErrorActionPreference = "Stop"
$root = (Resolve-Path "$PSScriptRoot/..").Path
$cluster = "devforge"

Write-Host "==> Creating kind cluster '$cluster'" -ForegroundColor Cyan
if (-not ((kind get clusters) -match "^$cluster$")) {
  kind create cluster --config "$root/demo/kind-config.yaml"
}

Write-Host "==> Building images" -ForegroundColor Cyan
docker build -t devforge/control-plane:latest "$root/services/control-plane"
docker build -t devforge/operator:latest "$root/operators/k8s"

Write-Host "==> Loading images into kind" -ForegroundColor Cyan
kind load docker-image devforge/control-plane:latest --name $cluster
kind load docker-image devforge/operator:latest --name $cluster

Write-Host "==> Deploying control plane" -ForegroundColor Cyan
kubectl apply -f "$root/deploy/manifests/control-plane.yaml"
if ($env:OPENAI_API_KEY) {
  kubectl -n devforge-system create secret generic devforge-secrets --from-literal=OPENAI_API_KEY="$($env:OPENAI_API_KEY)" --dry-run=client -o yaml | kubectl apply -f -
  kubectl -n devforge-system rollout restart deploy/devforge-control-plane
}

Write-Host "==> Deploying operator (CRD, RBAC, policy, deployment)" -ForegroundColor Cyan
kubectl apply -f "$root/operators/k8s/manifests/crd.yaml"
kubectl apply -f "$root/operators/k8s/manifests/rbac.yaml"
kubectl apply -f "$root/operators/k8s/manifests/operator.yaml"

Write-Host "==> Deploying deliberately-broken workloads" -ForegroundColor Cyan
kubectl apply -f "$root/demo/workloads.yaml"

Write-Host ""
Write-Host "Cluster is up. Two more terminals:" -ForegroundColor Green
Write-Host "  1) kubectl -n devforge-system port-forward svc/devforge-control-plane 8000:8000"
Write-Host "  2) pnpm --filter @devforge/dashboard dev      # http://localhost:3001"
Write-Host "Watch:  kubectl get pods -A -w"
