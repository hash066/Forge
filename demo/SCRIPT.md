# DevForge OS — 90-second demo script

A judge-proof run. Works **with or without** an OpenAI key and **with or without** a real cluster.
If anything live misbehaves, the deterministic engine + simulator keep the exact same demo running.

## Setup (before you hit record)
```bash
# 1. control plane  (add OPENAI_API_KEY to services/control-plane/.env for live GPT-5.5)
cd services/control-plane && . .venv/Scripts/activate && uvicorn app.main:app --port 8000
# 2. dashboard
pnpm --filter @devforge/dashboard dev          # → http://localhost:3001
# 3. (optional) real cluster instead of sim:  ./demo/up.sh
```
Open **http://localhost:3001**, full-screen, hard-refresh once so the fonts load.

## The run (≈90s)

**0:00 — The hook (Overview).**
> "This is DevForge OS — an autonomous AI SRE for Kubernetes. When a workload breaks, it doesn't
> page a human. It diagnoses the incident with GPT and fixes it — under policy, with a full audit
> trail. Here's the cluster: healthy, 24 pods."

**0:12 — Break the cluster (click "Run live demo").**
> "I'll inject six real failures — a crash loop, an OOM kill, a bad image, an unschedulable pod, a
> privileged container, an over-provisioned workload."

Cluster health drops; incidents cascade into the feed.

**0:25 — The wow (Incidents).**
> "Watch one incident. DevForge **investigates** — you can see the tool calls it made: it pulled the
> events, read the logs, described the pod. Then GPT streams its **root cause**, with a confidence
> score, and proposes the exact fix."

Point at the live tool-call trace + the typewriter reasoning + the remediation plan.

**0:45 — The loop closes.**
> "Low-risk fixes auto-apply; risky ones wait for one click — that's the `RemediationPolicy`. As each
> fix lands, the incident heals and cluster health climbs back to 100%."

**0:58 — Topology.**
> "The whole cluster, live — namespaces and pods. Incidents pulse red; healed pods settle to green."

**1:08 — Ask your cluster.**
> "And you can just ask it." Type: *"What did you just fix?"* → GPT answers over live state, citing
> the incidents.

**1:20 — The close.**
> "Detect, diagnose with OpenAI, remediate, audit — autonomously. Real kopf operator, real Kubernetes
> API calls, OpenAI GPT-5.5, shipped as a Helm chart. That's DevForge OS."

## Fallback notes (don't say these out loud)
- No `OPENAI_API_KEY`? Cards read "simulated reasoning" — identical visuals, deterministic RCA.
- Control plane down? The dashboard shows last-known state instead of erroring.
- Use `./demo/sim.sh --loop` to keep incidents flowing continuously during a longer recording.
