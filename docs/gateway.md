# Gateway protocol

Petasos talks only to `homelab-gateway` over Tailscale. The live client is
`src/services/gatewayClient.ts`. This page is the contract backup: if the
UI is rewritten, these routes and payloads stay.

Base URL: `VITE_GATEWAY_BASE_URL` (default
`https://homelab.tail042a16.ts.net`). Browser dev uses `/__gateway` and
injects `GATEWAY_API_KEY`. Tauri reads the same key at runtime.

Never send `provider`, `model`, or `model_options`. Send opaque `model_id`
from `GET /v1/models` (or Mission Control overview), plus optional
`reasoning_effort`.

## Mission Control bootstrap

| Method | Path | Client |
| --- | --- | --- |
| GET | `/v1/mission-control/overview` | `getMissionControlOverview` |

Preferred launch snapshot. Concurrent sections for allowed models, Hermes
capabilities, skills, and toolsets. Each section carries `available:
true|false` so a partial upstream failure is a local alert, not a global
cockpit failure.

Until the production container is rebuilt from the gateway tree that ships
this route, Petasos falls back to assembling the same shape from:

- `GET /v1/models`
- `GET /v1/hermes/capabilities`
- `GET /v1/hermes/skills`
- `GET /v1/hermes/toolsets`

## Health and catalogue

| Method | Path | Client |
| --- | --- | --- |
| GET | `/health` | `checkHealth` |
| GET | `/v1/models` | `listModels` |
| GET | `/v1/hermes/skills` | `listHermesSkills` |
| GET | `/v1/hermes/toolsets` | `listHermesToolsets` |
| GET | `/v1/hermes/capabilities` | `getHermesCapabilities` |

`GET /v1/hermes/skills` returns the Hermes-installed skills overview only
(`name`, `description`, `category`). The gateway does not expose Hermes
filesystem or editable skill bodies; Petasos Skills is read-only until a
dedicated notes/skills model exists.

Toolsets distinguish `enabled` vs `configured` in Status.

## Conversations

| Method | Path | Client |
| --- | --- | --- |
| GET | `/v1/conversations` | `listConversations` |
| POST | `/v1/conversations` | `createConversation` |
| PATCH | `/v1/conversations/{id}` | `updateConversation` |
| DELETE | `/v1/conversations/{id}` | `deleteConversation` |
| POST | `/v1/conversations/{id}/fork` | `forkConversation` |
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

## Runs

| Method | Path | Client |
| --- | --- | --- |
| POST | `/v1/runs` | `createRun` |
| GET | `/v1/runs/{id}` | `getRun` |
| POST | `/v1/runs/{id}/approval` | `resolveApproval` |
| POST | `/v1/runs/{id}/steer` | `steerRun` |
| POST | `/v1/runs/{id}/stop` | `stopRun` |

Steer body: `{ "input": "guidance text" }`. Approval choices:
`once` | `session` | `always` | `deny`.

Chat shows Stop + Steer while a turn streams. Approvals stay in the
existing dialog. Do not call Hermes OpenAI-compat surfaces or expose
filesystem / terminal / browser controls in the UI.

## Observability

| Method | Path | Service |
| --- | --- | --- |
| GET | `/v1/metrics/overview` | `hostMetricsService` |
| GET | `/v1/usage/codex` | `codexUsageService` |
| GET | `/v1/usage/opencode-go` | `openCodeGoUsageService` |

### Not on the gateway yet

Tailscale can list machines via
`GET https://api.tailscale.com/api/v2/tailnet/{tailnet}/devices`
(API key auth). Petasos must not call that from the client. When needed,
add a dedicated gateway route such as `GET /v1/tailnet/devices` that keeps
the Tailscale key server-side and returns a dashboard-safe device list
(hostname, online, addresses, OS, lastSeen).

Hermes loopback (`:8642`) and Ollama (`:11434`) stay behind the gateway in
remote mode. Local Docker sandbox is optional and never called from the
SPA over Tailscale.
