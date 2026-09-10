# Petasos

Cross-platform Mission Control for a sandboxed [Hermes Agent](https://hermes-agent.nousresearch.com/) (Nous Research).

Petasos is a Tauri v2 + React desktop/mobile client that observes and steers a fully self-contained Docker test environment: local Ollama for inference, Hermes gateway for agent execution, and no required host-side tools beyond Docker and the Tauri toolchain.

## Stack

| Layer | Choice |
| --- | --- |
| Shell | Tauri v2 (desktop + mobile) |
| UI | React 19 + TypeScript + Vite |
| Styling | Tailwind CSS v4 + shadcn-style primitives |
| State | Zustand |
| Protocol | HTTP REST + SSE against Hermes `/v1/runs` |
| Sandbox | Docker Compose (`sandbox/`) |

## Prerequisites

- Node.js 22+
- Rust toolchain (stable)
- Docker + Docker Compose
- Platform deps for Tauri: see [Tauri prerequisites](https://v2.tauri.app/start/prerequisites/)

## Quick start

```bash
npm install
cp .env.example .env
npm run sandbox:init
npm run tauri:dev
```

Frontend-only (browser against local Hermes):

```bash
npm run sandbox:init
npm run dev
```

## Sandbox

The sandbox lives in `sandbox/` and creates two containers on `petasos-net`:

1. `llm-local` — `ollama/ollama` on `11434`
2. `hermes` — `nousresearch/hermes-agent` gateway on `8642` (+ debug dashboard `9119`)

### Start

```bash
npm run sandbox:init
# or
bash sandbox/init-sandbox.sh
```

The init script:

1. Starts Ollama
2. Waits for HTTP readiness
3. Pulls `qwen2.5-coder:1.5b` (falls back to `llama3.2:1b`)
4. Starts Hermes with `API_SERVER_KEY=petasos-local-dev-token`

### Reset memory

```bash
npm run sandbox:reset
```

Stops the stack and deletes `sandbox/sandbox-data/hermes` so the agent restarts with a clean memory volume.

### Endpoints

| Service | URL |
| --- | --- |
| Hermes API | `http://127.0.0.1:8642` |
| Hermes health | `http://127.0.0.1:8642/health` |
| Hermes dashboard | `http://127.0.0.1:9119` |
| Ollama | `http://127.0.0.1:11434` |

Auth header for Hermes:

```http
Authorization: Bearer petasos-local-dev-token
```

## Application views

- **Status** — probes Hermes + Ollama connectivity
- **Console** — command input, Markdown responses, live execution timeline from SSE
- **Skills & Memory** — inspect/edit Markdown skills (filesystem binding lands next)
- **Approval modal** — human-in-the-loop gate for critical Hermes actions

## Useful commands

```bash
npm run dev           # Vite SPA
npm run build         # Typecheck + production frontend build
npm run tauri:dev     # Desktop shell with hot reload
npm run tauri:build   # Native bundles
npm run lint          # oxlint
npm run sandbox:init  # Boot Docker sandbox
npm run sandbox:reset # Wipe Hermes memory volume
```

## Mobile

Tauri v2 mobile targets share this frontend. After platform tooling is installed:

```bash
npm run tauri android init
npm run tauri ios init
npm run tauri android dev
npm run tauri ios dev
```

Network permissions already allow local Hermes/Ollama loopback URLs used by the desktop sandbox. Emulators may need host-mapped addresses (documented when mobile work starts).

## Project layout

```text
src/                 React application
src/services/        Hermes HTTP + SSE client
src/stores/          Zustand stores
src/components/      UI primitives and feature panels
src-tauri/           Tauri/Rust shell + capabilities
sandbox/             Docker Compose + lifecycle scripts
.cursor/rules/       Agent/editor conventions
docs/                Architecture notes
```

## Configuration

Copy `.env.example` to `.env` to override defaults:

- `VITE_HERMES_BASE_URL`
- `VITE_OLLAMA_BASE_URL`
- `VITE_HERMES_API_KEY`
- `VITE_HERMES_MODEL`

## Documentation

- [Architecture](docs/architecture.md)
- [Sandbox operations](docs/sandbox.md)

## License

Private project scaffold. Add a license when publishing.
