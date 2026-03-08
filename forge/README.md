# DevForge: Architecture-First AI IDE Extension

DevForge is a powerful VS Code extension designed to help developers build and maintain high-quality system architectures. It provides real-time drift detection, security scanning, cost estimation, and educational tools for student developers.

## 🚀 Key Features

- **Architecture Drift Detection**: Automatically compares your code against a defined `.devforge/architecture.json` blueprint.
- **Security & Vulnerability Scanner**: Detects hardcoded secrets and common vulnerabilities like SQL injection.
- **Scale Predictor**: Identifies potential system bottlenecks based on projected user load.
- **Comprehension Validator (Student Mode)**: Challenges developers with quizzes when bulk AI-generated code is detected.
- **Argue With Me Mode**: Forces architectural justification for significant structural changes.
- **Cost Estimation**: Provides real-time AWS cost estimates based on detected services.

## 🛠️ Requirements

- VS Code 1.109.0+
- Node.js (for local analysis components)

## ⚙️ Extension Settings

DevForge contributes the following settings:

* `devforge.demoMode`: (Boolean) When enabled (default: `true`), the extension uses realistic mock data instead of calling the live backend. This is perfect for trying out all features without an internet connection or AWS credentials.
* `devforge.apiEndpoint`: (String) The backend API URL for live analysis.

## 🧪 Demo Mode & Sample Project

To see DevForge in action immediately:

1. **Enable Demo Mode**: Ensure `devforge.demoMode` is set to `true` in your VS Code settings.
2. **Open the Sample Project**: Navigate to the `sample-project` directory in this repository.
3. **Explore**:
   - Open `index.js` to see real-time drift and security violations.
   - Switch to **Student Mode** in the sidebar to see your skill matrix.
   - Paste a large block of code to trigger the **Comprehension Quiz**.
   - Add a new AWS service (e.g., `new S3Client()`) to trigger the **Architectural Challenge**.

## 📄 License

MIT
