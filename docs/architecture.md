# Architecture

Petasos is a thin observability client. Hermes does the agent work inside Docker; the UI streams status, tokens, tool events, and approvals over HTTP/SSE.

## Runtime topology

```text
┌────────────────────────────┐
│ Petasos (Tauri + React)    │
│  Status / Console / Skills │
└──────────────┬─────────────┘
               │ REST + SSE
               ▼
┌────────────────────────────┐
│ Hermes gateway             │
│ local :8642 or Tailscale   │
└──────────────┬─────────────┘
               │ model backend (homelab-managed)
               ▼
┌────────────────────────────┐
│ Provider / local Ollama    │
│ (optional for Petasos)     │
└────────────────────────────┘
```

## Frontend modules

| Path | Responsibility |
| --- | --- |
| `src/services/hermesClient.ts` | Authenticated REST + SSE parsing |
| `src/services/skillsService.ts` | Skills inventory adapter |
| `src/stores/*` | Zustand slices for connection, chat, timeline, skills, approvals, UI |
| `src/hooks/useConnectionHealth.ts` | Periodic health polling |
| `src/hooks/useRunStream.ts` | Create run + fan out SSE into stores |
| `src/components/*` | Presentational shells split by feature |
| `src/views/*` | Route-like top-level screens |

## Hermes integration

Primary control plane:

- `GET /health` / `GET /health/detailed`
- `POST /v1/runs`
- `GET /v1/runs/{id}`
- `GET /v1/runs/{id}/events` (SSE)
- `POST /v1/runs/{id}/approval`
- `POST /v1/runs/{id}/stop`
- `GET /v1/capabilities`

The client maps SSE payloads into timeline events and optional token deltas for the assistant bubble.

## Tauri boundary

`src-tauri/capabilities/default.json` scopes HTTP to local Hermes/Ollama URLs and Tailscale `*.ts.net` hosts. Browser Vite dev proxies Hermes via `/__hermes` when CORS is disabled on the gateway. Future iterations can add filesystem scope for `sandbox/sandbox-data/hermes/skills`.

## Remote vs local

| Mode | Hermes URL | Ollama probe |
| --- | --- | --- |
| Local sandbox | `http://127.0.0.1:8642` | optional via `VITE_OLLAMA_BASE_URL` |
| Tailscale / remote | `https://…ts.net` | skipped; model status from `/v1/models` |
## Design principles

- English-only source and docs
- No inline comments; names and structure carry intent
- Small files with one responsibility
- Dark slate/zinc Mission Control aesthetic
- Prefer updating docs/rules when architecture changes
