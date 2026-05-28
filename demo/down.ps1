# Tear down the DevForge OS demo kind cluster.
kind delete cluster --name devforge
Write-Host "kind cluster 'devforge' deleted." -ForegroundColor Green
