# DevForge OS — Demo

Two ways to show the self-healing loop. Both produce the same dashboard story:
**a cluster degrades → DevForge detects each incident → GPT diagnoses the root
cause → a remediation is proposed/auto-applied → the cluster heals, live.**

---

## Option A — Local demo (recommended, zero infra) ⚡

No Docker, no Kubernetes. Runs the *real* detector pipeline against realistic
broken-pod fixtures and drives the control plane through the full cycle.

```powershell
# Windows
./demo/run-local.ps1
```
```bash
# macOS / Linux
./demo/run-local.sh
```

This launches the control plane (`:8000`), the dashboard (`:3001`), opens the
browser, and loops the detect → diagnose → heal scenario. You can also click
**“Run live demo”** in the dashboard to trigger a cycle on demand.

> Set `OPENAI_API_KEY` (in `services/control-plane/.env`) for live GPT-powered
> diagnoses. Without it, the deterministic SRE engine drives an identical demo.

Run just the driver against an already-running control plane:
```bash
./demo/sim.sh --loop        # or: ./demo/sim.ps1 -Loop
```

## Option B — Live kind cluster 🐳

Real Kubernetes. The operator runs in-cluster, watches real failing pods, and
remediates them through the Kubernetes API.

```bash
# Requires docker + kind + kubectl
./demo/up.sh                # ./demo/up.ps1 on Windows
# then, in two terminals:
kubectl -n devforge-system port-forward svc/devforge-control-plane 8000:8000
pnpm --filter @devforge/dashboard dev      # http://localhost:3001

kubectl get pods -A -w       # watch them go Pending/CrashLoop → Running
./demo/down.sh               # tear down
```

---

## The 60-second talk track

1. **“Here’s a healthy-looking cluster.”** Open the dashboard — health ring,
   cost, security posture.
2. **“Now it breaks.”** Six workloads fail at once: a crash-looping payments
   service, an OOM-killed cart, a bad image tag, a privileged pod, a workload
   with no limits, and one that can’t be scheduled. Health drops to ~75%.
3. **“DevForge sees everything instantly.”** Each incident appears in the live
   feed with severity and the offending workload.
4. **“And it knows *why*.”** Each card shows a GPT root-cause analysis with a
   confidence score — not just ‘pod is down’, but ‘the memory limit is below the
   working set; raise it to 384Mi’.
5. **“It proposes the exact fix.”** A concrete remediation — rollback, resource
   bump, image pin, probe tweak — with the equivalent `kubectl` command, a risk
   rating, and whether it auto-applies or waits for approval (the policy gate).
6. **“Watch it heal.”** Low-risk fixes auto-apply; the rest you approve with one
   click. Incidents flip to *Resolved*, the health ring climbs back to 100%, and
   every action lands in the immutable audit log.

**The pitch:** an autonomous AI SRE that turns a 2 a.m. pager storm into a feed
of fixes that already happened — powered by OpenAI, safe by policy, auditable by
design.

## Faults demonstrated
CrashLoopBackOff · OOMKilled · ImagePullBackOff · PrivilegedPod (security) ·
MissingLimits (reliability) · Unschedulable (capacity/cost).
