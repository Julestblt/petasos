# Architecture

Petasos is a thin observability client for the private homelab gateway. The UI
talks only to documented gateway routes; Hermes, Glances, and the Codex exporter
stay loopback-only behind the gateway.

## Runtime topology

```text
┌────────────────────────────┐
│ Petasos (Tauri + React)    │
│  Status / Console / Skills │
└──────────────┬─────────────┘
               │ REST (Bearer gateway key)
               ▼
┌────────────────────────────┐
│ Tailscale Serve :443       │
│ homelab.tail042a16.ts.net  │
└──────────────┬─────────────┘
               │ loopback
               ▼
┌────────────────────────────┐
│ homelab-gateway :8644      │
└──────┬──────────┬──────────┘
       │          │
       ▼          ▼
  Hermes :8642   Glances / Codex exporter
```

## Frontend modules

| Path | Responsibility |
| --- | --- |
| `src/services/gatewayClient.ts` | Auth’d REST + run polling |
| `src/services/hostMetricsService.ts` | `GET /v1/metrics/overview` |
| `src/services/codexUsageService.ts` | `GET /v1/usage/codex` |
| `src/services/openCodeGoUsageService.ts` | `GET /v1/usage/opencode-go` |
| `src/stores/*` | Zustand slices for connection, chat, timeline, modes, quotas |
| `src/hooks/useRunStream.ts` | Create run + poll until terminal status |
| `src/components/*` | Presentational shells split by feature |

## Gateway integration

Control plane used by Petasos:

- `GET /health`
- `GET /v1/model-policy`
- `POST /v1/runs`
- `GET /v1/runs/{id}`
- `GET /v1/metrics/overview`
- `GET /v1/usage/codex`
- `GET /v1/usage/opencode-go`

Clients never send `provider`, `model`, or `model_options`. They select a mode
(`auto` / `admin` / `dev`) and the gateway injects the upstream model target.

There is no SSE stream, no sessions API, and no approval route on the gateway.
Petasos polls run status and uses a local dashboard `session_id`.

## Auth

- Browser `npm run dev`: Vite proxies `/__gateway` and injects `Authorization`
  from process env `GATEWAY_API_KEY` (never `VITE_*`).
- Tauri: Rust reads `GATEWAY_API_KEY` at runtime and exposes it via
  `gateway_api_key` for authenticated HTTP plugin calls.

## Tauri boundary

`src-tauri/capabilities/default.json` scopes HTTP to Tailscale `*.ts.net` hosts
and local sandbox ports. Do not embed the gateway key in the frontend bundle.

## Design principles

- English-only source and docs
- No inline comments; names and structure carry intent
- Small files with one responsibility
- Prefer updating docs/rules when architecture changes
