# Usage quotas

Petasos shows **5h** rolling windows in the sidebar for configured providers.

## Codex (homelab exporter)

```http
GET https://homelab.tail042a16.ts.net:8444/v1/codex/usage
Authorization: Bearer <exporter_key>
```

```bash
VITE_CODEX_USAGE_URL=https://homelab.tail042a16.ts.net:8444/v1/codex/usage
VITE_CODEX_USAGE_TOKEN=…
```

Get the exporter key on the host:

```bash
sudo cat /root/.codex-usage-exporter.env
```

Notes:

- Not the OpenAI Platform API key.
- Exporter keeps ChatGPT OAuth server-side.
- If login expires, re-run `codex login` on the host.

## OpenCode Go (cloud API)

```http
GET https://opencode.ai/zen/go/v1/usage
Authorization: Bearer sk-opencode-…
```

Example payload:

```json
{
  "usage": {
    "rolling": { "status": "ok", "percent": 9, "resetsAt": "…" },
    "weekly": { "status": "ok", "percent": 12, "resetsAt": "…" },
    "monthly": { "status": "ok", "percent": 6, "resetsAt": "…" }
  }
}
```

Petasos uses `usage.rolling` (≈5h) only.

```bash
VITE_OPENCODE_GO_API_KEY=sk-opencode-…
```

Optional URL override:

```bash
VITE_OPENCODE_GO_USAGE_URL=https://opencode.ai/zen/go/v1/usage
```

Browser `npm run dev` proxies through `/__opencode-go`. Tauri allows `https://opencode.ai/**`.

## Polling

Both providers refresh every 30s when configured.
