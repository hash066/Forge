# DevForge E-Commerce Sample

This project is designed to demonstrate DevForge's architectural and security features.

## Intentional Issues for Demo:
1. **Architecture Drift**: The `index.js` uses `MongoClient` (MongoDB), but the blueprint in `.devforge/architecture.json` specifies `PostgreSQL`.
2. **Security Leak**: Line 6 contains a hardcoded AWS secret key.
3. **Database Vulnerability**: Line 11 contains a classic SQL Injection pattern (string concatenation).
4. **Scale Bottleneck**: Line 19 creates a new DB connection for every request, which will cause connection exhaustion at scale.
5. **Over-engineering Alert**: The blueprint projects 100K users for a simple monolith, triggering scale predictions.

## Steps:
1. Open this folder in VS Code.
2. Ensure DevForge is active.
3. Observe the **Status Bar** and **Explorer Panel**.
4. The **Security Gate** should block you due to the hardcoded secret.
5. Toggle between **Student** and **Dev** mode in the Explorer panel to see skill growth and explanations.
6. Try to "Fix" the code to see the Violations list update in real-time.
