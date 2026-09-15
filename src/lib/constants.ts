export const HERMES_BASE_URL =
  import.meta.env.VITE_HERMES_BASE_URL ?? 'http://127.0.0.1:8642'

export const OLLAMA_BASE_URL = (import.meta.env.VITE_OLLAMA_BASE_URL ?? '').trim()

export const HERMES_API_KEY =
  import.meta.env.VITE_HERMES_API_KEY ?? 'petasos-local-dev-token'

export const DEFAULT_MODEL =
  import.meta.env.VITE_HERMES_MODEL ?? 'hermes-agent'

export const HOST_METRICS_URL = (import.meta.env.VITE_HOST_METRICS_URL ?? '').trim()

export const HOST_METRICS_USERNAME = (
  import.meta.env.VITE_HOST_METRICS_USERNAME ?? ''
).trim()

export const HOST_METRICS_PASSWORD = (
  import.meta.env.VITE_HOST_METRICS_PASSWORD ?? ''
).trim()

export const CODEX_USAGE_URL = (import.meta.env.VITE_CODEX_USAGE_URL ?? '').trim()

export const CODEX_USAGE_TOKEN = (import.meta.env.VITE_CODEX_USAGE_TOKEN ?? '').trim()

export const OPENCODE_GO_API_KEY = (
  import.meta.env.VITE_OPENCODE_GO_API_KEY ?? ''
).trim()

export const OPENCODE_GO_USAGE_URL = (
  import.meta.env.VITE_OPENCODE_GO_USAGE_URL ??
  'https://opencode.ai/zen/go/v1/usage'
).trim()

export const OPERATOR_NAME = import.meta.env.VITE_OPERATOR_NAME ?? 'Jules'
export const OPERATOR_ROLE = import.meta.env.VITE_OPERATOR_ROLE ?? 'humain'

export const HEALTH_POLL_INTERVAL_MS = 5_000
export const METRICS_POLL_INTERVAL_MS = 5_000
export const QUOTAS_POLL_INTERVAL_MS = 30_000

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

export function resolveHostMetricsUrl(): string | null {
  if (!HOST_METRICS_URL) return null
  if (import.meta.env.DEV && !isTauriRuntime() && /^https?:\/\//.test(HOST_METRICS_URL)) {
    return '/__metrics'
  }
  return HOST_METRICS_URL.replace(/\/$/, '')
}

export function resolveCodexUsageUrl(): string | null {
  if (!CODEX_USAGE_URL) return null
  if (import.meta.env.DEV && !isTauriRuntime() && /^https?:\/\//.test(CODEX_USAGE_URL)) {
    return '/__codex'
  }
  return CODEX_USAGE_URL.replace(/\/$/, '')
}

export function resolveOpenCodeGoUsageUrl(): string | null {
  if (!OPENCODE_GO_USAGE_URL) return null
  if (
    import.meta.env.DEV &&
    !isTauriRuntime() &&
    /^https?:\/\//.test(OPENCODE_GO_USAGE_URL)
  ) {
    return '/__opencode-go'
  }
  return OPENCODE_GO_USAGE_URL.replace(/\/$/, '')
}

export function hostLabelFromHermesUrl(url: string = HERMES_BASE_URL): string {
  try {
    return new URL(url).hostname.replace(/\.ts\.net$/, '')
  } catch {
    return 'hermes'
  }
}
