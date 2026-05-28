# DevForge OS — Kubernetes Operator

An autonomous SRE agent for Kubernetes. It watches the cluster, detects incidents
with deterministic detectors, asks the DevForge control plane for an **AI
root-cause analysis + remediation**, and (per `RemediationPolicy`) applies the
fix and reports the outcome — all streamed live to the dashboard.

## Two ways to run

### 1. Live (real cluster)
```bash
kubectl apply -f manifests/crd.yaml
kubectl apply -f manifests/rbac.yaml
kubectl apply -f manifests/operator.yaml   # set DEVFORGE_CONTROL_PLANE_URL
```
Or run locally against your kubeconfig:
```bash
pip install -r requirements.txt
DEVFORGE_CONTROL_PLANE_URL=http://localhost:8000 kopf run --standalone -m devforge_operator.main
```

### 2. Simulation (no cluster — for demos & CI)
Replays realistic broken-pod fixtures through the exact detector pipeline and
drives the full detect → diagnose → heal narrative against the control plane:
```bash
pip install httpx structlog
DEVFORGE_CONTROL_PLANE_URL=http://localhost:8000 python -m devforge_operator.simulator
```

## Detectors
CrashLoopBackOff · OOMKilled · ImagePullBackOff/ErrImagePull · ProbeFailure ·
StuckRollout · Unschedulable · MissingLimits · OverProvisioned · PrivilegedPod ·
HighRestarts. Detectors are pure functions (`detectors.py`) — unit-tested with
zero cluster (`pytest tests/`).

## Configuration (env)
| Var | Default | Meaning |
|---|---|---|
| `DEVFORGE_CONTROL_PLANE_URL` | `http://localhost:8000` | Control plane base URL |
| `DEVFORGE_TENANT_ID` | `demo` | Tenant (sent as `X-Tenant-Id`) |
| `DEVFORGE_MODE` | `suggest` | `auto` \| `suggest` \| `off` |
| `DEVFORGE_CLUSTER` | `kind-devforge` | Cluster label |
| `DEVFORGE_NAMESPACES` | _(all)_ | Comma list to watch |
| `DEVFORGE_EXCLUDED_NAMESPACES` | system ns | Comma list to skip |

## RemediationPolicy CRD
`mode` (auto/suggest/off), `maxRiskAuto` (only auto-apply ≤ this risk),
`allowedActions`, `excludedNamespaces`. Safe default: **suggest**.
