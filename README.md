# Petasos

Cross-platform Mission Control for a sandboxed [Hermes Agent](https://hermes-agent.nousresearch.com/) (Nous Research), reached through the private [homelab-gateway](https://github.com/Julestblt/homelab-gateway).

Petasos is a Tauri v2 + React desktop/mobile client. In remote mode it talks only to the documented gateway API over Tailscale. A local Docker sandbox remains available for offline Hermes/Ollama work.

## Stack

| Layer | Choice |
| --- | --- |
| Shell | Tauri v2 (desktop + mobile) |
| UI | React 19 + TypeScript + Vite |
| Styling | Tailwind CSS v4 + shadcn-style primitives |
| State | Zustand |
| Protocol | HTTP REST against `homelab-gateway` (`/v1/runs`, metrics, usage) |
| Sandbox | Docker Compose (`sandbox/`) for local Hermes/Ollama |

## Prerequisites

- Node.js 22+
- Rust toolchain (stable)
- Docker + Docker Compose (optional local sandbox)
- Platform deps for Tauri: see [Tauri prerequisites](https://v2.tauri.app/start/prerequisites/)

### Ubuntu / WSL2 (desktop shell)

`npm run tauri:dev` needs WebKitGTK development packages. Runtime GTK alone is not enough.

```bash
sudo apt update
sudo apt install -y \
  libwebkit2gtk-4.1-dev \
  build-essential \
  curl wget file \
  libxdo-dev \
  libssl-dev \
  libayatana-appindicator3-dev \
  librsvg2-dev \
  libglib2.0-dev \
  pkg-config
```

Frontend-only work does not need these packages:

```bash
npm run sandbox:init
npm run dev
```

## Quick start

```bash
npm install
cp .env.example .env
# Set GATEWAY_API_KEY from the host client env; keep mode 0600.
npm run tauri:dev
```

Frontend-only (browser against the Tailscale gateway via Vite proxy):

```bash
npm run dev
```

## Sandbox

The sandbox lives in `sandbox/` and creates two containers on `petasos-net`:

1. `llm-local` — `ollama/ollama` on `11434`
2. `hermes` — `nousresearch/hermes-agent` gateway on `8642` (+ debug dashboard `9119`)

Remote Petasos does **not** call these ports over Tailscale. They remain host-local behind `homelab-gateway`.

### Start

```bash
npm run sandbox:init
# or
bash sandbox/init-sandbox.sh
```

### Reset memory

```bash
npm run sandbox:reset
```

### Endpoints (local sandbox only)

| Service | URL |
| --- | --- |
| Hermes API | `http://127.0.0.1:8642` |
| Hermes health | `http://127.0.0.1:8642/health` |
| Hermes dashboard | `http://127.0.0.1:9119` |
| Ollama | `http://127.0.0.1:11434` |

## Application views

- **Status** — probes gateway health + model policy
- **Console** — command input, mode picker (`auto` / `admin` / `dev`), Markdown responses, run timeline from polling
- **Skills & Memory** — local scaffold (gateway does not expose skills routes)
- **Approval modal** — gateway has no approval route; UI explains the limitation

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

## Project layout

```text
src/                 React application
src/services/        Gateway HTTP client
src/stores/          Zustand stores
src/components/      UI primitives and feature panels
src-tauri/           Tauri/Rust shell + capabilities
sandbox/             Docker Compose + lifecycle scripts
.cursor/rules/       Agent/editor conventions
docs/                Architecture notes
```

## Configuration

Copy `.env.example` to `.env`:

```bash
VITE_GATEWAY_BASE_URL=https://homelab.tail042a16.ts.net
VITE_OPERATOR_NAME=Jules
VITE_OPERATOR_ROLE=humain
GATEWAY_API_KEY=…
```

Rules:

- Never rename `GATEWAY_API_KEY` to `VITE_*` — Vite would embed it in the browser bundle.
- Browser `npm run dev` proxies `/__gateway` and injects the bearer key server-side.
- Tauri reads `GATEWAY_API_KEY` from the process environment at runtime.
- Do not set legacy `VITE_HERMES_*`, `VITE_HOST_METRICS_*`, `VITE_CODEX_USAGE_*`, or `VITE_OPENCODE_GO_*`.

Gateway routes used by Petasos:

- `GET /health`
- `GET /v1/model-policy`
- `POST /v1/runs`
- `GET /v1/runs/{id}`
- `GET /v1/metrics/overview`
- `GET /v1/usage/codex`
- `GET /v1/usage/opencode-go`

## Documentation

- [Architecture](docs/architecture.md)
- [Sandbox operations](docs/sandbox.md)
- [Host metrics](docs/host-metrics.md)
- [Usage quotas](docs/quotas.md)

## License

Private project scaffold. Add a license when publishing.
