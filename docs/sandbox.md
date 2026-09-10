# Sandbox

Self-contained Hermes test environment. Nothing outside Docker is required for agent execution.

## Files

| File | Purpose |
| --- | --- |
| `docker-compose.yml` | `llm-local` + `hermes` on `petasos-net` |
| `init-sandbox.sh` | Boot, wait, pull model, start Hermes |
| `reset-env.sh` | Stop stack and wipe Hermes data |
| `sandbox-data/` | Persistent volumes (gitignored) |

## Volumes

- `sandbox-data/ollama` → Ollama model store
- `sandbox-data/hermes` → `HERMES_HOME` (skills, memory, state)

## Environment (Hermes)

| Variable | Value |
| --- | --- |
| `API_SERVER_ENABLED` | `true` |
| `API_SERVER_HOST` | `0.0.0.0` |
| `API_SERVER_PORT` | `8642` |
| `API_SERVER_KEY` | `petasos-local-dev-token` |
| `OPENAI_BASE_URL` | `http://llm-local:11434/v1` |
| `OPENAI_API_KEY` | `ollama` |
| `MODEL_NAME` | `qwen2.5-coder:1.5b` |

`API_SERVER_HOST=0.0.0.0` is required so published Docker ports are reachable from the host/Tauri client.

## Operations

```bash
bash sandbox/init-sandbox.sh
docker compose -f sandbox/docker-compose.yml logs -f hermes
bash sandbox/reset-env.sh
```

Override the pulled model:

```bash
MODEL_NAME=llama3.2:1b bash sandbox/init-sandbox.sh
```
