# Architecture

Petasos is a thin Mission Control client for the private homelab gateway.
The UI talks only to documented gateway routes; Hermes, Glances, and usage
exporters stay loopback-only behind the gateway.

## Runtime topology

```text
┌────────────────────────────┐
│ Petasos (Tauri + React)    │
│  Chat / Status / Skills    │
└──────────────┬─────────────┘
               │ REST + SSE (Bearer gateway key)
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
  Hermes :8642   Glances / Codex / OpenCode Go
```

## Frontend modules

| Path | Responsibility |
| --- | --- |
| `src/services/gatewayClient.ts` | Models, conversations, SSE stream, approvals |
| `src/services/hostMetricsService.ts` | `GET /v1/metrics/overview` |
| `src/services/codexUsageService.ts` | `GET /v1/usage/codex` |
| `src/services/openCodeGoUsageService.ts` | `GET /v1/usage/opencode-go` |
| `src/stores/*` | Zustand slices for chat, conversations, models, quotas |
| `src/hooks/useConversationStream.ts` | Send turn + fan out SSE into stores |
| `src/components/layout/*` | shadcn sidebar, operator card, telemetry |
| `src/components/chat/*` | Thread, live action stream, composer |

## Gateway integration

See [Gateway protocol](gateway.md) for the full contract. Primary chat
plane:

- `GET /v1/models`
- `GET/POST /v1/conversations`
- `GET /v1/conversations/{id}/messages`
- `POST /v1/conversations/{id}/messages/stream` (SSE)
- `POST /v1/conversations/{id}/model`
- `POST /v1/runs/{id}/approval`

Observability:

- `GET /health`
- `GET /v1/metrics/overview`
- `GET /v1/usage/codex`
- `GET /v1/usage/opencode-go`

Clients never send `provider`, `model`, or `model_options`. They send
opaque `model_id` values from `/v1/models`, plus optional
`reasoning_effort` (`low` / `medium` / `high`) when
`capabilities.reasoning` is true.

SSE mapping:

- `assistant.delta` → Hermes bubble text
- `tool.*` → live `ActionStream`
- `approval.request` → approval dialog (`once` / `session` / `always` / `deny`)
- `assistant.completed` / `run.completed` → finalize turn

## Auth

- Browser `npm run dev`: Vite proxies `/__gateway` and injects
  `Authorization` from process env `GATEWAY_API_KEY` (never `VITE_*`).
- Tauri: Rust reads `GATEWAY_API_KEY` at runtime via `gateway_api_key`.

## Design principles

- English-only source and docs
- No inline comments; names and structure carry intent
- Small kebab-case UI files; compose shadcn primitives
- Single shell: shadcn sidebar, GazeHero companion, HUD telemetry in the
  footer, conversations in the rail
- Tokens live in `src/index.css`; do not fork a second theme
- Prefer updating docs/rules when architecture changes
