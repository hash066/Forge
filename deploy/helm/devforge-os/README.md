# DevForge OS Helm chart

Installs the DevForge OS **control plane** (AI brain) and **operator**
(self-healing agent) with least-privilege RBAC and the `RemediationPolicy` CRD.

```bash
helm install devforge-os ./deploy/helm/devforge-os \
  --namespace devforge-system --create-namespace \
  --set ai.openaiApiKey=$OPENAI_API_KEY \
  --set operator.mode=suggest
```

## Key values

| Value | Default | Description |
|---|---|---|
| `ai.provider` | `openai` | `openai` \| `bedrock` \| `offline` |
| `ai.openaiModel` | `gpt-5.5` | OpenAI model id |
| `ai.openaiApiKey` | `""` | Inline key (or use `ai.existingSecret`) |
| `ai.existingSecret` | `""` | Secret containing `OPENAI_API_KEY` |
| `operator.mode` | `suggest` | `auto` \| `suggest` \| `off` |
| `operator.maxRiskAuto` | `low` | Highest risk eligible for auto-apply |
| `tenantId` | `default` | Tenant scope |
| `clusterName` | `production` | Cluster label shown in the dashboard |
| `controlPlane.databaseUrl` | `""` (SQLite) | Postgres DSN for production persistence |

## Notes
- The CRD in `crds/` installs before the templates (Helm convention).
- Without an OpenAI key the control plane falls back to the deterministic SRE
  engine, so the operator still functions for demos.
- For production persistence, set `controlPlane.databaseUrl` to a Postgres DSN
  and run `alembic upgrade head` (see `services/control-plane`).
