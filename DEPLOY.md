# DevForge — Deploy Guide

Step-by-step to take everything from this repo to live production.
Target region: **ap-south-1 (Mumbai)**. Region is overridable via `AWS_REGION`.

There are three independent surfaces:
1. **Backend** → AWS App Runner (~10 min, ~$26/mo idle)
2. **Marketing site** → Vercel (~5 min, free)
3. **VS Code extension** → install the `.vsix` locally now; publish to Marketplace later

You can do them in any order, but extension is most useful after backend is live.

---

## 1. Backend → AWS App Runner

### 1.1 — Prereqs (one-time, ~5 min)

```powershell
# Install AWS CLI v2 (Windows)
winget install Amazon.AWSCLI

# Verify
aws --version
# aws-cli/2.x.x ...

# Configure credentials. Use an IAM user with AdministratorAccess (you can
# scope down later). Generate creds at: IAM Console → Users → your-user
# → Security credentials → Create access key.
aws configure
# AWS Access Key ID [None]: AKIA...
# AWS Secret Access Key [None]: ...
# Default region name [None]: ap-south-1
# Default output format [None]: json

# Confirm
aws sts get-caller-identity
# { "UserId": "...", "Account": "123456789012", "Arn": "..." }
```

### 1.2 — Enable Bedrock Claude Sonnet 4 model access (~2 min)

```
AWS Console → Bedrock → Model access → Modify model access
→ check "Claude Sonnet 4" (Anthropic)
→ Submit → wait for status "Access granted" (usually <1 min)
```

If the model isn't listed for ap-south-1, switch the deploy region to one
where it is: `us-east-1`, `us-west-2`, or `eu-west-1` are safe.

### 1.3 — One-time CDK bootstrap (~3 min, only first deploy per account/region)

```powershell
cd infra/cdk
pnpm install
$env:AWS_REGION = "ap-south-1"
pnpm bootstrap
```

This creates the CDK staging S3 bucket and roles. Skip on later deploys.

### 1.4 — First `cdk deploy` (creates ECR + IAM, App Runner will fail health check until image exists)

```powershell
pnpm deploy
```

Note the outputs printed at the end:
- `EcrRepositoryUri` — e.g. `123456789012.dkr.ecr.ap-south-1.amazonaws.com/devforge-control-plane`
- `ServiceUrl` — e.g. `https://abcd1234.ap-south-1.awsapprunner.com`

### 1.5 — Build + push the Docker image

```powershell
# Set vars (replace ACCOUNT with the number from sts get-caller-identity)
$env:AWS_REGION = "ap-south-1"
$ACCOUNT = (aws sts get-caller-identity --query Account --output text)
$REPO = "${ACCOUNT}.dkr.ecr.ap-south-1.amazonaws.com/devforge-control-plane"

# Ensure Docker Desktop is running, then:
cd D:\Forge

# Auth
aws ecr get-login-password --region ap-south-1 | docker login --username AWS --password-stdin $REPO

# Build (multi-stage, ~2 min)
docker build -t devforge-control-plane:latest services/control-plane

# Tag + push (~3-5 min depending on bandwidth)
docker tag devforge-control-plane:latest "${REPO}:latest"
docker push "${REPO}:latest"
```

### 1.6 — App Runner auto-redeploys when ECR `:latest` updates

Wait ~3 min, then verify:

```powershell
# ServiceUrl was printed by `cdk deploy` — use it directly, or look it up:
$URL = (aws apprunner list-services --region ap-south-1 --query "ServiceSummaryList[?ServiceName=='devforge-control-plane'].ServiceUrl | [0]" --output text)
$URL = "https://$URL"

curl "$URL/health"
# {"status":"ok","version":"0.1.0"}

# Smoke-test a deterministic endpoint
curl -X POST "$URL/v1/security/scan" `
  -H "Content-Type: application/json" `
  -H "X-Tenant-Id: prod-test" `
  -d '{"scan_type":"code","target":{"content":"password = \"hunter2\"","type":"terraform"}}'
```

### 1.7 — Code updates after first deploy

Just rebuild + push the image. App Runner auto-redeploys on new `:latest`:

```powershell
docker build -t "${REPO}:latest" services/control-plane && docker push "${REPO}:latest"
```

No `cdk deploy` needed unless infrastructure (IAM, env vars, instance size) changes.

### 1.8 — Tear-down (if you want to stop paying)

```powershell
cd infra/cdk
pnpm destroy
```

Removes App Runner, ECR (with images), IAM role, log group.

---

## 2. Marketing site → Vercel

### 2.1 — Push the repo to GitHub first (see section 4)

### 2.2 — Connect Vercel

1. Go to https://vercel.com/new
2. Import the `hash066/Forge` repository
3. Vercel auto-detects Next.js. Override these settings:
   - **Root Directory:** `apps/marketing`
   - **Build Command:** `cd ../.. && pnpm install --frozen-lockfile && pnpm --filter @devforge/marketing build`
   - **Output Directory:** `apps/marketing/.next` (default)
   - **Install Command:** leave empty (handled in build command)
4. Environment variables:
   - `NEXT_PUBLIC_SITE_URL` → your Vercel URL (e.g. `https://devforge.vercel.app`)
   - `NEXT_PUBLIC_API_URL` → the App Runner URL from step 1.6
   - `NEXT_PUBLIC_VSCODE_EXTENSION_URL` → leave default until you publish to marketplace
   - `NEXT_PUBLIC_DEMO_URL` → your Cal.com / Calendly link or leave default
5. Click **Deploy**

First build takes ~3 min. After: every git push to `main` re-deploys.

### 2.3 — Custom domain (optional)

Vercel → Project → Settings → Domains → add `devforge.io` → follow DNS steps.

---

## 3. VS Code extension

### 3.1 — Install the pre-built `.vsix` (already in repo after build)

```powershell
cd D:\Forge\apps\extension
pnpm build           # only if you've changed code; .vsix may already exist
pnpm package         # produces devforge-vscode.vsix

# Install it
code --install-extension devforge-vscode.vsix
```

VS Code now has DevForge in the activity bar (left rail). Open the
"DevForge" view. The status bar shows "DevForge offline" until you point it
at the backend:

### 3.2 — Point the extension at your backend

`Ctrl+Shift+P` → "DevForge: Set API URL" → paste the App Runner ServiceUrl
from step 1.6. The status bar should flip to "DevForge ●  connected".

Open any Terraform / Python / JS file → save → see findings inline.

### 3.3 — Publish to VS Code Marketplace (optional, later)

```powershell
# One-time: create a publisher at https://marketplace.visualstudio.com/manage
# then create a personal access token at https://dev.azure.com → User
# Settings → Personal access tokens → New token (scope: Marketplace, Manage)

cd apps/extension
npx vsce login devforge        # paste PAT
npx vsce publish               # uploads current package.json version
```

---

## 4. Push to GitHub (`hash066/Forge`)

```powershell
cd D:\Forge
git status                     # confirm the reconstruction commit is there
git push origin main
```

If pushing fails with auth, create a GitHub PAT:
GitHub → Settings → Developer settings → Personal access tokens → Tokens (classic) →
Generate new token (classic), scope `repo`. Then:

```powershell
# Use the token as the password when git prompts (Windows Credential Manager
# will cache it for future pushes).
git push origin main
# Username: hash066
# Password: <paste the PAT>
```

---

## Verification checklist

After all four sections complete, you should have:

- [ ] `curl https://<backend-url>/health` → 200
- [ ] `https://<vercel-url>/` → marketing site loads with hero + features
- [ ] VS Code → DevForge sidebar visible → "connected" badge
- [ ] Save a `.tf` file with `password = "x"` → security gate modal pops
- [ ] Status bar shows live cost estimate when editing AWS resources
- [ ] `https://github.com/hash066/Forge` → latest commit visible

---

## Troubleshooting

**App Runner stuck "OPERATION_IN_PROGRESS"** — first deploy can take 5-7 min, especially for the first image pull. Be patient.

**App Runner "ROLLBACK_FAILED"** — Docker image missing or health check failing. Check CloudWatch logs at `/aws/apprunner/devforge-control-plane/service`. Common cause: forgot to push the image to ECR before `cdk deploy`.

**Bedrock 403** — model access not granted yet, or wrong region. Check IAM role has `bedrock:InvokeModel`, and the role's ARN allows the model in your region.

**Extension "offline"** — `Ctrl+Shift+P` → "Developer: Show Logs" → "Extension Host" — look for `[devforge]` lines. Most common cause: CORS. Add your VS Code dev host to `ALLOWED_ORIGINS` on App Runner.

**Vercel build fails on workspace deps** — make sure root `package.json` declares the workspaces correctly (it does), and that the build command does `cd ../..` to install at the monorepo root first.
