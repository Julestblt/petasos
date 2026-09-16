# Usage quotas

Petasos shows **5h** rolling windows from the homelab gateway for Codex and
OpenCode Go. Upstream provider keys stay on the gateway host.

## Codex

```http
GET https://homelab.tail042a16.ts.net/v1/usage/codex
Authorization: Bearer <GATEWAY_API_KEY>
```

## OpenCode Go

```http
GET https://homelab.tail042a16.ts.net/v1/usage/opencode-go
Authorization: Bearer <GATEWAY_API_KEY>
```

The gateway forwards the OpenCode Go subscription payload and keeps
`OPENCODE_GO_API_KEY` server-side. A `503` with `opencode_go_not_configured`
means the homelab key has not been set on the gateway.

Petasos reads `usage.rolling` (≈5h) only.

## Petasos `.env`

```bash
VITE_GATEWAY_BASE_URL=https://homelab.tail042a16.ts.net
GATEWAY_API_KEY=…
```

Do not set `VITE_CODEX_USAGE_*` or `VITE_OPENCODE_GO_*`.

## Polling

Both providers refresh every 30s while the app is open.
