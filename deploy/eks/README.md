# DevForge OS on AWS EKS

A production path that runs the operator **and** control plane inside a real EKS
cluster. (For a zero-cost local run, use `demo/up.sh` with kind instead.)

## Prereqs
`aws` CLI configured · `eksctl` · `kubectl` · `helm` · `docker`

## 1. Create the cluster (~15 min)
```bash
eksctl create cluster -f deploy/eks/cluster.yaml
```

## 2. Build + push images to ECR
```bash
ACCOUNT=$(aws sts get-caller-identity --query Account --output text)
REGION=ap-south-1
REGISTRY=$ACCOUNT.dkr.ecr.$REGION.amazonaws.com
aws ecr create-repository --repository-name devforge-control-plane --region $REGION || true
aws ecr create-repository --repository-name devforge-operator --region $REGION || true
aws ecr get-login-password --region $REGION | docker login --username AWS --password-stdin $REGISTRY

docker build -t $REGISTRY/devforge-control-plane:latest services/control-plane && docker push $REGISTRY/devforge-control-plane:latest
docker build -t $REGISTRY/devforge-operator:latest operators/k8s && docker push $REGISTRY/devforge-operator:latest
```

## 3. Install DevForge OS (Helm)
```bash
helm install devforge-os ./deploy/helm/devforge-os \
  --namespace devforge-system --create-namespace \
  --set ai.openaiApiKey=$OPENAI_API_KEY \
  --set operator.mode=suggest \
  --set clusterName=eks-prod \
  --set controlPlane.image.repository=$REGISTRY/devforge-control-plane \
  --set operator.image.repository=$REGISTRY/devforge-operator
```

## 4. Point the dashboard at it
```bash
kubectl -n devforge-system port-forward svc/devforge-control-plane 8000:8000
NEXT_PUBLIC_API_URL=http://localhost:8000 pnpm --filter @devforge/dashboard dev
```
(or expose the control plane via an Ingress / LoadBalancer Service and set
`NEXT_PUBLIC_API_URL` to that URL for a hosted dashboard.)

## 5. (Optional) Postgres persistence
Provision Aurora/RDS Postgres and set `--set controlPlane.databaseUrl=postgresql://…`,
then run `alembic upgrade head` against it.

## Tear down
```bash
helm uninstall devforge-os -n devforge-system
eksctl delete cluster -f deploy/eks/cluster.yaml
```

> The **control plane** alternatively runs on AWS App Runner (cheaper, simpler) —
> see `infra/cdk` and `DEPLOY.md`. In that topology only the **operator** runs in
> EKS, pointed at the App Runner URL via `operator` env / Helm `--set`.
