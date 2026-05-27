# API to Codebase Mapping Report

This document maps the provided documentation (`aws.txt` and `devforge_api_documentation.docx`) with the architecture and task requirements of the local codebase (`architecture-first-ide-kiro`).

**AWS Account / Region:** `617987691289` / `eu-north-1`
**Sign-in console:** https://617987691289.signin.aws.amazon.com/console

**API Gateways:**
- `infra-ai-api` (id `1plv9rmbhb`) — risk / analysis / security / drift / cost
  - Base: `https://1plv9rmbhb.execute-api.eu-north-1.amazonaws.com/dev`
- `devforge-api` (id `ghwl6o43ch`) — blueprint / diagram / health (and `predict-scale`, `quiz/generate`, `detect-patterns` per docx)
  - Base: `https://ghwl6o43ch.execute-api.eu-north-1.amazonaws.com/dev`
- `devforge-realtime` (id `6fhd8botk8`) — WebSocket
  - WSS: `wss://6fhd8botk8.execute-api.eu-north-1.amazonaws.com/dev/`
  - Management (server → client push): `https://6fhd8botk8.execute-api.eu-north-1.amazonaws.com/dev/@connections`

**Data layer:**
- ElastiCache Redis OSS (`devforge-redis`) — `devforge-redis.pkcts0.ng.0001.eun1.cache.amazonaws.com:6379`
- RDS (master user/password configured separately, not embedded here)

---

## 1. Analysis & Risk Management
**Related to:** Phase 3 – Chaos Monkey Agent / Phase 1 - Architecture Validation

* **AWS Endpoint**: `POST https://1plv9rmbhb.execute-api.eu-north-1.amazonaws.com/dev/analyze`
* **AWS Endpoint**: `POST https://1plv9rmbhb.execute-api.eu-north-1.amazonaws.com/dev/risk`
* **AWS Endpoint**: `POST https://1plv9rmbhb.execute-api.eu-north-1.amazonaws.com/dev/security`
* **AWS Endpoint**: `POST https://1plv9rmbhb.execute-api.eu-north-1.amazonaws.com/dev/drift`
* **Codebase Target**: These align directly with the **RiskScorer** and **DriftDetector** classes detailed in `design.md`. Currently, `frontend/src/engine/constraintValidator.ts` exists for local validation, but these endpoints provide the backend offloaded logic for risk scoring, security scans, and drift detection.

## 2. Infrastructure Blueprint Generation
**Related to:** Phase 1 – Core Architecture Validation Engine

* **Docx Endpoint**: `POST /generate-blueprint`
* **AWS Endpoint**: `POST https://ghwl6o43ch.execute-api.eu-north-1.amazonaws.com/dev/generate-blueprint`
* **Lambda**: `devforge-generate-blueprint`
* **Example payload** (from docx):
  ```json
  {
    "constraints": {
      "current_users": 1000,
      "projected_users": 10000,
      "budget": 150,
      "team_size": 3,
      "architecture_type": "microservices",
      "domain": "web"
    },
    "project_name": "my-saas-app",
    "code": ""
  }
  ```
* **Codebase Target**: Defined in `design.md` as the **Blueprint Generator**. The `Architecture Builder Component` (frontend UI) is responsible for taking user limits (Current/Projected Users, Team Size, Budget) and calling this API to get architectural components (e.g., API Gateway, Services, Caches).

## 3. Architecture Diagrams
**Related to:** Visual Feedback / Visualization

* **Docx Endpoint**: `POST /diagram`
* **AWS Endpoint**: `POST https://ghwl6o43ch.execute-api.eu-north-1.amazonaws.com/dev/diagram`
* **Lambda**: `devforge-get-diagram`
* **Example payload** (from docx):
  ```json
  {
    "code": "resource \"aws_s3_bucket\" \"data\" {}",
    "language": "terraform"
  }
  ```
* **Codebase Target**: This converts Terraform/CloudFormation into visual graphs. It will integrate with the IDE extension hook (Phase 5) to display real-time diagrammatic feedback to the user when they provide code.

## 4. Scale Prediction & Algorithm Detection
**Related to:** Advanced Validations

* **Docx Endpoint**: `POST /predict-scale`
  * **AWS Endpoint**: `POST https://ghwl6o43ch.execute-api.eu-north-1.amazonaws.com/dev/predict-scale`
  * **Lambda**: `devforge-predict-scale`
  * **Example payload** (from docx):
    ```json
    {
      "architecture": {
        "database": {"type": "rds", "instance_class": "db.t3.micro"},
        "compute": {"instance_type": "t3.small"}
      },
      "current_users": 800
    }
    ```
* **Docx Endpoint**: `POST /detect-patterns`
  * **AWS Endpoint**: `POST https://ghwl6o43ch.execute-api.eu-north-1.amazonaws.com/dev/detect-patterns`
  * **Lambda**: `devforge-detect-patterns`
  * **Example payload** (from docx):
    ```json
    {
      "code": "for (let i=0;i<n;i++){ for(let j=0;j<n;j++){}}",
      "language": "javascript"
    }
    ```
* **Codebase Target**: Validates performance and scaling constraints. Connects with the `ConstraintValidator.ts` to push code via WebSocket or REST to the backend to predict failure points (e.g., O(n²) bottlenecks or DB connection exhaustion).

## 5. Kiro Comprehension Validator (Pop Quiz)
**Related to:** Phase 4 – Kiro Comprehension Validator

* **Docx Endpoint**: `POST /quiz/generate`
* **AWS Endpoint**: `POST https://ghwl6o43ch.execute-api.eu-north-1.amazonaws.com/dev/quiz/generate`
* **Lambda**: `devforge-generate-quiz`
* **Example payload** (from docx):
  ```json
  {
    "code": "function add(a,b){ return a+b; }",
    "language": "javascript"
  }
  ```
* **Codebase Target**: The **Mentor Console Generator** UI component. After an architecture is generated or modified, the IDE will query this endpoint sending the current code/architecture to get a multiple-choice question to test the developer.

## 6. AWS Cost Whisperer
**Related to:** Phase 2 – AWS Cost Whisperer

* **AWS Endpoint**: `POST https://1plv9rmbhb.execute-api.eu-north-1.amazonaws.com/dev/cost`
* **Codebase Target**: The **Cost Gate System** component. This maps to the Phase 2 UI overlays that trigger a budget threshold warning based on the architecture JSON processed by the pricing endpoint.

## 7. Real-Time Interactions (WebSocket)
**Related to:** Post-Tool Use Hooks / Async IDE Feedback

* **AWS Endpoint**: `wss://6fhd8botk8.execute-api.eu-north-1.amazonaws.com/dev/`
* **Management Endpoint** (backend → client push): `https://6fhd8botk8.execute-api.eu-north-1.amazonaws.com/dev/@connections`
* **Codebase Target**: Integrates with the **Code Editor Component** (Monaco editor). It will send code changes (debounced) through this WebSocket to the backend validator and receive real-time highlighted violation warnings directly in the IDE UI.

## 8. Health Check
**Related to:** CLI `devforge health`, frontend status pill, smoke tests

* **AWS Endpoint**: `GET https://ghwl6o43ch.execute-api.eu-north-1.amazonaws.com/dev/health`
* **Codebase Target**: `cli/src/client.rs::health_check` and `frontend/src/devforge/services/api-client.ts::health`.

---
### Final Endpoint Inventory (resolved)

| Method | Full URL | Source |
| --- | --- | --- |
| GET  | https://ghwl6o43ch.execute-api.eu-north-1.amazonaws.com/dev/health | aws.txt + docx |
| POST | https://ghwl6o43ch.execute-api.eu-north-1.amazonaws.com/dev/generate-blueprint | aws.txt + docx |
| POST | https://ghwl6o43ch.execute-api.eu-north-1.amazonaws.com/dev/diagram | aws.txt + docx |
| POST | https://ghwl6o43ch.execute-api.eu-north-1.amazonaws.com/dev/predict-scale | docx |
| POST | https://ghwl6o43ch.execute-api.eu-north-1.amazonaws.com/dev/quiz/generate | docx |
| POST | https://ghwl6o43ch.execute-api.eu-north-1.amazonaws.com/dev/detect-patterns | docx |
| POST | https://1plv9rmbhb.execute-api.eu-north-1.amazonaws.com/dev/analyze | aws.txt |
| POST | https://1plv9rmbhb.execute-api.eu-north-1.amazonaws.com/dev/risk | aws.txt |
| POST | https://1plv9rmbhb.execute-api.eu-north-1.amazonaws.com/dev/drift | aws.txt |
| POST | https://1plv9rmbhb.execute-api.eu-north-1.amazonaws.com/dev/cost | aws.txt |
| POST | https://1plv9rmbhb.execute-api.eu-north-1.amazonaws.com/dev/security | aws.txt |
| WSS  | wss://6fhd8botk8.execute-api.eu-north-1.amazonaws.com/dev/ | aws.txt |

### Summary of Current Codebase State
The current `frontend/src` directory is largely unpopulated except for `engine/constraintValidator.ts`, `App.tsx`, and `main.tsx`. The design, tasks, and requirements are fully fleshed out, meaning the next step is to **implement API service layers** in the frontend to connect your React components to these documented AWS API Gateway URLs.
