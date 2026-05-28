# DevForge OS — one-command LOCAL demo (no cluster, no Docker).
# Launches the control plane (:8000) and dashboard (:3001) in their own windows,
# opens the browser, then drives a looping detect -> diagnose -> heal cycle.
#
# Set OPENAI_API_KEY (in services/control-plane/.env or your env) for real GPT
# diagnoses; otherwise the deterministic SRE engine drives the demo.
$ErrorActionPreference = "Stop"
$root = (Resolve-Path "$PSScriptRoot/..").Path

Write-Host "==> Starting control plane on :8000" -ForegroundColor Cyan
Start-Process powershell -ArgumentList @(
  "-NoExit", "-Command",
  "cd '$root/services/control-plane'; if (Test-Path .venv/Scripts/Activate.ps1) { . .venv/Scripts/Activate.ps1 }; `$env:PYTHONUTF8='1'; python -m uvicorn app.main:app --port 8000"
)

Start-Sleep -Seconds 3
Write-Host "==> Starting dashboard on :3001" -ForegroundColor Cyan
Start-Process powershell -ArgumentList @(
  "-NoExit", "-Command",
  "cd '$root'; pnpm --filter '@devforge/dashboard' dev"
)

Write-Host "==> Waiting for services to come up..." -ForegroundColor Cyan
Start-Sleep -Seconds 9
Start-Process "http://localhost:3001"

Write-Host "==> Driving the self-healing demo (Ctrl+C to stop)" -ForegroundColor Green
& "$PSScriptRoot/sim.ps1" -Loop
