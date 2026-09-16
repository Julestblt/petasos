# Agent guide

Petasos is Mission Control for Hermes, reached through the private
`homelab-gateway` on Tailscale.

Read first:

1. `README.md`
2. `docs/architecture.md`
3. `.cursor/rules/`

Working agreements:

- English only
- No comments in source
- Keep modules small and readable
- Evolve docs and Cursor rules when the architecture changes
- Prefer Tauri-friendly SPA patterns (no SSR)
- Single shadcn shell; GazeHero is a companion only
- Theme tokens live in `src/index.css`; never hand-edit `src/components/ui`


Remote defaults:

- Gateway `https://homelab.tail042a16.ts.net`
- Auth `Authorization: Bearer <GATEWAY_API_KEY>` (never `VITE_*`)
- Chat via `/v1/conversations` + `/messages/stream`
- Models via `/v1/models` (`model_id` + optional `reasoning_effort`)

Local sandbox (optional Docker only):

- Hermes `http://127.0.0.1:8642`
- Ollama `http://127.0.0.1:11434`

## Agent skills

### Issue tracker

GitHub Issues via `gh` (repo `Julestblt/petasos`). See `docs/agents/issue-tracker.md`.

### Triage labels

Default roles: `needs-triage`, `needs-info`, `ready-for-agent`, `ready-for-human`, `wontfix`. See `docs/agents/triage-labels.md`.

### Domain docs

Single-context layout (`CONTEXT.md` + `docs/adr/`). See `docs/agents/domain.md`.

