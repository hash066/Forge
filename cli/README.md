# DevForge CLI

Rust CLI tool for diagnosing build and runtime failures using the DevForge control plane.

## Installation

### Prerequisites
- Rust 1.70+
- Cargo

### Build

```bash
cargo build --release
```

The binary will be available at `target/release/devforge`.

## Configuration

Create a config file at `~/.devforge/config.toml`:

```toml
tenant_id = "your-tenant"
# Local FastAPI control plane (dev):
api_url   = "http://localhost:8000"
# Or point straight at the AWS API Gateway (eu-north-1):
# api_url = "https://ghwl6o43ch.execute-api.eu-north-1.amazonaws.com/dev"
api_key   = "dev-local-key"
```

Or use defaults for local development:
- `tenant_id`: local-dev
- `api_url`: http://localhost:8000
- `api_key`: dev-local-key

Production AWS endpoints (region `eu-north-1`):
- `devforge-api`:   https://ghwl6o43ch.execute-api.eu-north-1.amazonaws.com/dev
- `infra-ai-api`:   https://1plv9rmbhb.execute-api.eu-north-1.amazonaws.com/dev
- `devforge-realtime` (WSS): wss://6fhd8botk8.execute-api.eu-north-1.amazonaws.com/dev/

## Usage

### Diagnose a Failure

```bash
devforge wtf
```

Provide context via:
- Git history (automatically reads last 20 commits)
- Git diff (automatically reads HEAD changes)
- Stack trace via stdin or command arguments

Examples:

```bash
# Diagnose with inline error
devforge wtf "TypeError: Cannot read property 'x' of undefined"

# Diagnose from error log
devforge wtf < error.log

# Diagnose interactively (reads git + stdin)
devforge wtf
```

### Check Health

```bash
devforge health
```

### Show Configuration

```bash
devforge config
```

## Integration with Your Workflow

### Post-Build Error Diagnosis

```bash
npm run build 2>&1 | devforge wtf
```

### Debug Script

```bash
#!/bin/bash
set -e
npm run build || devforge wtf "$@"
```

## Development

```bash
cargo build
cargo run -- wtf "test error"
cargo test
```
