#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$ROOT_DIR"

MODEL_NAME="${MODEL_NAME:-qwen2.5-coder:1.5b}"
FALLBACK_MODEL="${FALLBACK_MODEL:-llama3.2:1b}"
OLLAMA_URL="${OLLAMA_URL:-http://127.0.0.1:11434}"
HERMES_URL="${HERMES_URL:-http://127.0.0.1:8642}"

mkdir -p sandbox-data/ollama sandbox-data/hermes/skills

echo "[petasos] Starting llm-local..."
docker compose up -d llm-local

echo "[petasos] Waiting for Ollama at ${OLLAMA_URL}..."
for _ in $(seq 1 60); do
  if curl -sf "${OLLAMA_URL}/api/tags" >/dev/null 2>&1; then
    echo "[petasos] Ollama is ready."
    break
  fi
  sleep 2
done

if ! curl -sf "${OLLAMA_URL}/api/tags" >/dev/null 2>&1; then
  echo "[petasos] Ollama did not become ready in time." >&2
  exit 1
fi

echo "[petasos] Pulling model ${MODEL_NAME}..."
if ! docker exec petasos-llm-local ollama pull "${MODEL_NAME}"; then
  echo "[petasos] Primary model pull failed; trying ${FALLBACK_MODEL}..."
  docker exec petasos-llm-local ollama pull "${FALLBACK_MODEL}"
  MODEL_NAME="${FALLBACK_MODEL}"
fi

echo "[petasos] Starting Hermes gateway..."
docker compose up -d hermes

echo "[petasos] Waiting for Hermes at ${HERMES_URL}..."
for _ in $(seq 1 60); do
  if curl -sf "${HERMES_URL}/health" >/dev/null 2>&1; then
    echo "[petasos] Hermes is ready."
    echo "[petasos] Gateway: ${HERMES_URL}"
    echo "[petasos] Dashboard: http://127.0.0.1:9119"
    echo "[petasos] Model: ${MODEL_NAME}"
    echo "[petasos] API key: petasos-local-dev-token"
    exit 0
  fi
  sleep 2
done

echo "[petasos] Hermes did not become ready in time. Check: docker compose logs hermes" >&2
exit 1
