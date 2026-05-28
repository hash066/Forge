# DevForge OS — cluster-free demo (no Docker/kind needed).
# Replays broken-pod fixtures through the real detector pipeline and drives the
# control plane through a full detect -> diagnose -> heal cycle.
#
# Prereq: the control plane is running (see run-local.ps1) and reachable at
# $env:DEVFORGE_CONTROL_PLANE_URL (default http://localhost:8000).
param([switch]$Loop)

if (-not $env:DEVFORGE_CONTROL_PLANE_URL) { $env:DEVFORGE_CONTROL_PLANE_URL = "http://localhost:8000" }
if (-not $env:DEVFORGE_TENANT_ID) { $env:DEVFORGE_TENANT_ID = "demo" }
$env:PYTHONUTF8 = "1"

Set-Location "$PSScriptRoot/../operators/k8s"
Write-Host "DevForge OS simulator -> $($env:DEVFORGE_CONTROL_PLANE_URL)" -ForegroundColor Cyan

$cliArgs = @()
if ($Loop) { $cliArgs += "--loop" }
python -m devforge_operator.simulator @cliArgs
