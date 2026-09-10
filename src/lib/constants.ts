export const HERMES_BASE_URL =
  import.meta.env.VITE_HERMES_BASE_URL ?? 'http://127.0.0.1:8642'

export const OLLAMA_BASE_URL =
  import.meta.env.VITE_OLLAMA_BASE_URL ?? 'http://127.0.0.1:11434'

export const HERMES_API_KEY =
  import.meta.env.VITE_HERMES_API_KEY ?? 'petasos-local-dev-token'

export const DEFAULT_MODEL =
  import.meta.env.VITE_HERMES_MODEL ?? 'qwen2.5-coder:1.5b'

export const HEALTH_POLL_INTERVAL_MS = 5_000
