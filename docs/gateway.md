# Gateway protocol

Petasos talks only to `homelab-gateway` over Tailscale. The live client is
`src/services/gatewayClient.ts`. This page is the contract backup: if the
UI is rewritten, these routes and payloads stay.

Base URL: `VITE_GATEWAY_BASE_URL` (default
`https://homelab.tail042a16.ts.net`). Browser dev uses `/__gateway` and
injects `GATEWAY_API_KEY`. Tauri reads the same key at runtime.

Never send `provider`, `model`, or `model_options`. Send opaque `model_id`
from `GET /v1/models`, plus optional `reasoning_effort`.

## Health and catalogue

| Method | Path | Client |
| --- | --- | --- |
| GET | `/health` | `checkHealth` |
| GET | `/v1/models` | `listModels` |

## Conversations

| Method | Path | Client |
| --- | --- | --- |
| GET | `/v1/conversations` | `listConversations` |
| POST | `/v1/conversations` | `createConversation` |
| PATCH | `/v1/conversations/{id}` | `updateConversation` |
| DELETE | `/v1/conversations/{id}` | `deleteConversation` |
| GET | `/v1/conversations/{id}/messages` | `listMessages` |
| POST | `/v1/conversations/{id}/model` | `setConversationModel` |
| POST | `/v1/conversations/{id}/messages/stream` | `streamConversationMessage` |

Create body:

```json
{
  "title": "optional",
  "model_id": "provider/model",
  "reasoning_effort": "medium"
}
```

Stream body:

```json
{
  "input": "user text",
  "model_id": "provider/model",
  "reasoning_effort": "medium"
}
```

SSE kinds the client understands:

- `assistant.delta` / `token.delta`
- `assistant.completed`
- `tool.started` / `tool.progress` / `tool.completed` / `tool.failed`
- `approval.request` / `approval.required`
- `run.completed` / `run.failed` / `run.cancelled`

## Runs (kept on the client)

| Method | Path | Client |
| --- | --- | --- |
| POST | `/v1/runs` | `createRun` |
| GET | `/v1/runs/{id}` | `getRun` |
| POST | `/v1/runs/{id}/approval` | `resolveApproval` |
| POST | `/v1/runs/{id}/stop` | `stopRun` |

Approval choices: `once` | `session` | `always` | `deny`.

## Observability

| Method | Path | Service |
| --- | --- | --- |
| GET | `/v1/metrics/overview` | `hostMetricsService` |
| GET | `/v1/usage/codex` | `codexUsageService` |
| GET | `/v1/usage/opencode-go` | `openCodeGoUsageService` |

Hermes loopback (`:8642`) and Ollama (`:11434`) stay behind the gateway in
remote mode. Local Docker sandbox is optional and never called from the
SPA over Tailscale.
