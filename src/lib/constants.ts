export const HERMES_BASE_URL =
  import.meta.env.VITE_HERMES_BASE_URL ?? 'http://127.0.0.1:8642'

export const OLLAMA_BASE_URL = (import.meta.env.VITE_OLLAMA_BASE_URL ?? '').trim()

export const HERMES_API_KEY =
  import.meta.env.VITE_HERMES_API_KEY ?? 'petasos-local-dev-token'

export const DEFAULT_MODEL =
  import.meta.env.VITE_HERMES_MODEL ?? 'hermes-agent'

export const HEALTH_POLL_INTERVAL_MS = 5_000

export const PROBE_OLLAMA = OLLAMA_BASE_URL.length > 0

export function isTauriRuntime(): boolean {
  return typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window
}

export function resolveHermesBaseUrl(): string {
  const configured = HERMES_BASE_URL.replace(/\/$/, '')
  if (import.meta.env.DEV && !isTauriRuntime()) {
    return '/__hermes'
  }
  return configured
}
