#!/usr/bin/env bash
# Tear down the DevForge OS demo kind cluster.
set -euo pipefail
kind delete cluster --name devforge
echo "✅ kind cluster 'devforge' deleted."
