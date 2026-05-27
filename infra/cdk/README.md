# DevForge AWS Deploy

Single-command deploy of the DevForge control plane to AWS App Runner.

## What you get

After running `pnpm deploy`:
- ECR repository `devforge-control-plane` holding your Docker image
- App Runner service running the FastAPI control plane
- IAM role with **least-privilege Bedrock access** (only Claude Sonnet 4)
- Public HTTPS endpoint (auto-issued by App Runner)
- CloudWatch logs at `/aws/apprunner/devforge-control-plane`
- Auto-scaling 1 → 25 instances, scales to zero on idle

**Cost:** ~$26/mo baseline (0.25 vCPU / 0.5 GB) + ~$0.007/min while serving requests.

## Prereqs

1. AWS account with **Bedrock Claude Sonnet 4 access** enabled in `ap-south-1` (or change region)
2. AWS CLI configured (`aws configure`) with credentials that have admin or equivalent
3. Docker installed and running
4. Node 20+ and pnpm

```bash
# Confirm prereqs
aws sts get-caller-identity
docker version
node --version       # >= 20
pnpm --version       # >= 9
```

## First-time setup (once per AWS account)

```bash
cd infra/cdk
pnpm install
pnpm bootstrap       # CDK bootstrap — sets up the asset bucket etc.
```

## Deploy

Two steps. The Docker image must be pushed to ECR before App Runner can pull it.

### Step 1 — Create ECR repo (creates everything but App Runner can't start yet)

```bash
pnpm deploy
# First run will create the ECR repo but App Runner will fail to pull `:latest`.
# Note the EcrRepositoryUri output, then continue:
```

### Step 2 — Build & push the Docker image

```bash
# From repo root
ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
REGION=ap-south-1
REPO_URI="${ACCOUNT_ID}.dkr.ecr.${REGION}.amazonaws.com/devforge-control-plane"

# Auth + push
aws ecr get-login-password --region $REGION \
  | docker login --username AWS --password-stdin $REPO_URI

docker build -t devforge-control-plane:latest services/control-plane
docker tag devforge-control-plane:latest $REPO_URI:latest
docker push $REPO_URI:latest
```

### Step 3 — Re-deploy (App Runner now finds the image)

```bash
cd infra/cdk
pnpm deploy
```

After ~3 minutes, App Runner reports `RUNNING`. The `ServiceUrl` output is your
production API URL. Update VS Code extension setting `devforge.apiUrl` to this URL.

## Verify

```bash
curl https://<your-app-runner-url>/health
# {"status":"ok","version":"0.1.0"}

curl -X POST https://<your-app-runner-url>/v1/security/scan \
  -H "Content-Type: application/json" \
  -H "X-Tenant-Id: prod-test" \
  -d '{"scan_type":"code","target":{"content":"password = \"hunter2\"","type":"terraform"}}'
```

## Updating

Code changes don't need a CDK redeploy — just rebuild + push the image. App Runner
auto-deploys on new `:latest` push (we enabled `autoDeploymentsEnabled`).

```bash
docker build -t $REPO_URI:latest services/control-plane && docker push $REPO_URI:latest
```

## Tearing down

```bash
cd infra/cdk
pnpm destroy
```

Removes App Runner, ECR (with images), IAM role, log group. Idempotent.

## Customization

- **Region**: set `AWS_REGION` or `CDK_DEFAULT_REGION` env var
- **Bedrock model**: edit `runtimeEnvironmentVariables.AWS_BEDROCK_MODEL_ID` in
  `lib/control-plane-stack.ts`
- **CPU / Memory**: edit `instanceConfiguration` (App Runner allowed values:
  0.25/0.5/1/2/4 vCPU paired with valid memory)
- **Custom domain**: add `apprunner.CfnCustomDomain` referencing your Route53
  hosted zone (Phase 1)

## What this stack deliberately omits

- **Postgres** — backend uses in-memory state for v1; add RDS Aurora Serverless v2 in Phase 1
- **Redis** — same; backend doesn't currently cache anything
- **WAF / rate limiting** — App Runner has request-rate limits built in; WAF is
  Phase 4 enterprise
- **CloudFront** — App Runner is already CDN-fronted

These are documented Phase 1+ work in the reconstruction plan.
