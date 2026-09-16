export const GATEWAY_BASE_URL = (
  import.meta.env.VITE_GATEWAY_BASE_URL ?? 'https://homelab.tail042a16.ts.net'
).trim()

export const OPERATOR_NAME = import.meta.env.VITE_OPERATOR_NAME ?? 'Jules'
export const OPERATOR_ROLE = import.meta.env.VITE_OPERATOR_ROLE ?? 'humain'

export const HEALTH_POLL_INTERVAL_MS = 5_000
export const METRICS_POLL_INTERVAL_MS = 5_000
export const QUOTAS_POLL_INTERVAL_MS = 30_000

export function isTauriRuntime(): boolean {
  return typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window
}

export function resolveGatewayBaseUrl(): string {
  const configured = GATEWAY_BASE_URL.replace(/\/$/, '')
  if (import.meta.env.DEV && !isTauriRuntime()) {
    return '/__gateway'
  }
  return configured
}

export function hostLabelFromGatewayUrl(url: string = GATEWAY_BASE_URL): string {
  try {
    return new URL(url).hostname.replace(/\.ts\.net$/, '')
  } catch {
    return 'homelab'
  }
}
