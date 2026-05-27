
Here is the complete, unified map of all features (Old + New) and exactly where they need to be built and deployed to create a moonshot-level enterprise platform.

---

### 🗺️ The DevForge Platform Map

#### 1. The Frontend / Developer Interfaces (Local Machine)

This is what the developer interacts with daily. It lives on their local machine.

* **DevForge Studio (The Kiro/VS Code Extension)**
* **[Old] Architecture-First Canvas:** The visual drag-and-drop system design tool.
* **[Old] Anti-Vibe Critic:** The adversarial AI that challenges lazy architectural decisions while typing.
* **[Old] Adversarial Lab:** Spins up local Docker containers to inject failures (e.g., latency spikes) into the developer's local code to test resilience.
* **[New] Cognitive Load Reducer (IDE Panel):** Automatically pulls relevant Jira tickets, Slack threads, and runbooks directly into the IDE based on the specific microservice the developer is currently editing.


* **DevForge CLI (The Terminal Interface)**
* **[New] Toil Elimination Platform:** A context-aware terminal tool. Typing `devforge wtf` instantly reads local git history, terminal stack traces, and AWS logs to explain why a local build is failing without the developer leaving the terminal.



#### 2. The Cloud Agents (Execution Environments)

These are the autonomous agents that run 24/7 inside the enterprise's infrastructure.

* **DevForge Pipeline Agent (CI/CD Integration)**
* *Where it lives:* Installed as a GitHub App, GitLab Runner, or AWS CodePipeline hook.
* **[New] Agentic CI/CD Repair:** Continuously monitors pipeline runs. When a build fails, it reads the logs, analyzes the commit, and autonomously submits a Pull Request with the fix.
* **[New] Intelligent Release Orchestration:** Pauses risky deployments by checking real-time monitoring data before promoting code to production.


* **DevForge K8s Operator (Infrastructure Integration)**
* *Where it lives:* Deployed directly inside the customer's Kubernetes clusters (Amazon EKS or Azure AKS).
* **[New] Agentic Self-Healing Cloud:** Ingests Prometheus/Datadog telemetry. If it detects a microservice cascade failure, it autonomously reroutes traffic or restarts pods before humans are paged.
* **[New] Internal Spot Market Scheduler:** Scans the private data center for idle CPU/GPU compute (e.g., at 2 AM) and automatically injects queued batch/ML workloads, killing them gracefully when production traffic returns.



#### 3. The Central Engine (Your AWS Backend)

This is your "Control Plane." It is the brain that connects the IDE, the CLI, the CI/CD pipelines, and the Kubernetes clusters.

* *Where it lives:* Your AWS Account (using your $10k credits).
* **The AI Reasoning Layer (Amazon Bedrock):** Uses Claude 3.5 Sonnet to process all the reasoning tasks—whether it is critiquing code from the IDE or diagnosing a K8s pod failure.
* **The API Gateway & Event Bus:** AWS API Gateway handles requests from the IDE/CLI, while Amazon EventBridge routes alerts from the CI/CD and K8s agents.
* **The Knowledge Graph (Amazon Neptune / RDS):** Stores the historical data. It tracks developer skill progression (from the Old features) and stores the incident history and resolution patterns (from the New features).

---

### 🏗️ Summary Matrix: Where to Build What

| Feature | Component Type | Deployed To | Tech Stack Focus |
| --- | --- | --- | --- |
| **Architecture Canvas & Critic** | IDE Extension | Kiro / VS Code | TypeScript, React, Webviews |
| **Adversarial Lab** | Local Sandbox | Developer's Docker | Python scripts, Docker API |
| **Cognitive Load & Debugging** | CLI / Terminal | Developer's OS | Rust or Go (for speed/CLI) |
| **CI/CD Pipeline Repair** | Cloud Integration | GitHub/GitLab/AWS | Webhooks, Git APIs |
| **Self-Healing & Spot Market** | K8s Operator | Amazon EKS / AKS | Go (Kubebuilder) or Python |
| **AI Brain & Data Storage** | Master Backend | Your AWS Account | FastAPI (Python), AWS Bedrock |

This architecture bridges the gap between individual developer education (the original idea) and enterprise-grade infrastructure autonomy (the new features).

# 🚀 DEVFORGE OS: MASTER SYSTEM CONTEXT

## 🎯 THE AGENT DIRECTIVE
You are an expert Principal Platform Engineer, Kubernetes Architect, and AI Systems Designer. Your task is to refactor and expand the existing `DevForge` repository. 

We are executing a massive pivot. We are moving from a standalone "AI-powered IDE extension for skill building" to an **Enterprise Platform Engineering Suite** (DevForge OS). We are building a "Datadog + GitHub Copilot Killer"—an autonomous DevOps platform powered by 4 interconnected AI agents.

**CRITICAL RULE:** Do NOT delete the existing IDE extension code. The IDE extension is our "Trojan Horse" wedge. We are *abstracting* the hardcoded logic out of the extension and moving it to a central AWS control plane, allowing us to support a new Terminal CLI, CI/CD Pipeline integrations, and Kubernetes Operators.

---

## 🏗️ THE NEW 4-PILLAR ARCHITECTURE
You must transition the codebase to support these four enterprise problem statements:

### 1. Agentic Developer Cognitive Load Reduction (The CLI / IDE Wedge)
* **What it is:** A context-aware Terminal CLI (`devforge`) and upgraded IDE panel.
* **The Goal:** Eliminate toil. When a dev types `devforge wtf`, it reads local git history, terminal stack traces, AWS/Azure logs, and internal runbooks to diagnose local build failures instantly.
* **Refactor Need:** Abstract existing local "Adversarial Lab" and "Anti-Vibe Critic" logic so it can be triggered via CLI and API, not just IDE webviews.

### 2. Agentic CI/CD Pipeline Repair
* **What it is:** A GitHub App / GitLab Runner integration.
* **The Goal:** Autonomous release orchestration. It monitors pipelines, reads failing test/log outputs, diagnoses root causes, and autonomously generates Pull Requests with fixes. It also acts as a risk-gatekeeper before production promotion.
* **Refactor Need:** Create a new webhook listener service in the backend to ingest GitHub/GitLab events.

### 3. Agentic Self-Healing Kubernetes Cloud
* **What it is:** A Kubernetes Operator deployed in the customer's EKS/AKS cluster.
* **The Goal:** Ingest Prometheus/Datadog telemetry. Autonomously diagnose pod crash loops or microservice cascading failures, and apply self-healing actions (rolling restarts, traffic rerouting) before paging a human.
* **Refactor Need:** We need a new `operators/` directory written in Go (Kubebuilder) or Python (Kopf) that communicates with our central AI brain.

### 4. Agentic Internal Spot Market Scheduler
* **What it is:** Dynamic resource optimization within the K8s Operator.
* **The Goal:** Detect idle GPU/CPU capacity in private data centers during off-peak hours and inject queued batch/ML workloads. Evict them gracefully when production traffic spikes.
* **Refactor Need:** Build custom Kubernetes scheduling logic and metrics-ingestion pipelines.

---

## ☁️ CLOUD INFRASTRUCTURE & CONSTRAINTS
We have **$10,000 AWS Credits** and **$10,000 Azure Credits**. We must design the system to be multi-cloud compatible but centrally managed.

* **The Control Plane (Central Brain):** Hosted on AWS. Uses **Amazon Bedrock (Claude 3.5 Sonnet)** for all heavy AI reasoning, API Gateway, and EventBridge.
* **The Execution Environments (The Drones):** * Local CLI (Rust/Go/Python).
    * CI/CD Hooks.
    * K8s Operators running on Amazon EKS or Azure AKS.
* **Storage:** Shift from hardcoded/local state to robust cloud databases (e.g., PostgreSQL via RDS, Neo4j/Graph logic abstracted to Neptune).

---

## 🛠️ STRICT REFACTORING GUIDELINES
When writing or modifying code, adhere strictly to these principles:

1.  **Decouple Frontend from AI Logic:** If you see Claude/Bedrock API calls happening directly in the frontend/extension, move them immediately to the FastAPI backend. 
2.  **Event-Driven Over Synchronous:** The new features (K8s healing, CI/CD repair) are asynchronous. Implement an event-bus architecture (using Redis Pub/Sub, AWS SQS, or EventBridge) rather than blocking REST calls.
3.  **No Hardcoding:** Remove all hardcoded configurations, API URLs, and mock data. Use environment variables and configuration files.
4.  **Multi-Tenant by Design:** Every log, metric, and action must be tied to a `tenant_id` or `workspace_id`. We are building for enterprise scale.
5.  **Idempotency:** All autonomous agent actions (especially K8s cluster modifications and Git PRs) must be idempotent. Do not spam clusters or repos with duplicate actions.

## 🚀 IMMEDIATE NEXT STEPS
When I prompt you to begin, your first task will be to review the existing backend directory structure, decouple the existing IDE-specific API routes, and create a unified `Control Plane` routing structure that can handle inputs from the IDE, the new CLI, and incoming CI/CD webhooks.