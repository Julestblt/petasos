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
│ hermes (:8642)             │
│  gateway + API server      │
└──────────────┬─────────────┘
               │ OpenAI-compatible
               ▼
┌────────────────────────────┐
│ llm-local / Ollama (:11434)│
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

`src-tauri/capabilities/default.json` scopes HTTP to local Hermes/Ollama/dashboard URLs. Future iterations can add filesystem scope for `sandbox/sandbox-data/hermes/skills`.

## Design principles

- English-only source and docs
- No inline comments; names and structure carry intent
- Small files with one responsibility
- Dark slate/zinc Mission Control aesthetic
- Prefer updating docs/rules when architecture changes
