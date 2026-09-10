# Agent guide

Petasos is Mission Control for a Docker-sandboxed Hermes Agent.

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

Local default endpoints:

- Hermes `http://127.0.0.1:8642`
- Ollama `http://127.0.0.1:11434`
- API key `petasos-local-dev-token`
