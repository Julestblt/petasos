#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$ROOT_DIR"

echo "[petasos] Stopping sandbox stack..."
docker compose down --remove-orphans

echo "[petasos] Purging Hermes memory..."
rm -rf sandbox-data/hermes
mkdir -p sandbox-data/hermes/skills

echo "[petasos] Sandbox reset complete."
