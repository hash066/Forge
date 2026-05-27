# DevForge Control Plane Backend

FastAPI server that provides AI-powered analysis and diagnosis endpoints for the DevForge platform.

## Setup

### Prerequisites
- Python 3.9+
- AWS account with Bedrock access (for production)
- pip

### Installation

1. Create a virtual environment:
```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

2. Install dependencies:
```bash
pip install -r requirements.txt
```

3. Configure environment:
```bash
cp .env.example .env
# Edit .env with your AWS credentials and configuration
```

## Running Locally

Start the development server:
```bash
uvicorn main:app --reload
```

The server will start at `http://localhost:8000`.

## API Endpoints

### Health Check
```
GET /health
```

### Analyze Code
```
POST /api/v1/analyze
Content-Type: application/json
X-API-Key: <api-key>

{
  "tenant_id": "your-tenant",
  "code": "...",
  "language": "typescript"
}
```

### Diagnose Failure
```
POST /api/v1/diagnose
Content-Type: application/json
X-API-Key: <api-key>

{
  "tenant_id": "your-tenant",
  "git_log": "...",
  "git_diff": "...",
  "stack_trace": "...",
  "local_logs": "..."
}
```

## Configuration

All configuration is managed via environment variables in `.env`:

- `AWS_REGION`: AWS region (default: us-east-1)
- `ANTHROPIC_MODEL_ID`: Claude model ID for Bedrock
- `AWS_ACCESS_KEY_ID`: AWS access key
- `AWS_SECRET_ACCESS_KEY`: AWS secret key
- `API_KEY_SECRET`: Shared secret for API authentication
- `ALLOWED_ORIGINS`: Comma-separated CORS origins
- `HOST`: Server host (default: 0.0.0.0)
- `PORT`: Server port (default: 8000)
- `DEBUG`: Enable debug mode (default: true)
