import { resolveGatewayBaseUrl } from '@/lib/constants'
import { createHttpFetch } from '@/lib/http'
import { gatewayAuthHeaders } from '@/services/gatewayAuth'
import type { ProviderQuota, QuotaWindow } from '@/types/quotas'

function parseWindow(value: unknown): QuotaWindow | null {
  if (!value || typeof value !== 'object') return null
  const record = value as Record<string, unknown>
  const usedPercent =
    typeof record.usedPercent === 'number'
      ? record.usedPercent
      : typeof record.used_percent === 'number'
        ? record.used_percent
        : typeof record.percent === 'number'
          ? record.percent
          : null
  const windowLabel =
    typeof record.window === 'string'
      ? record.window
      : typeof record.window_label === 'string'
        ? record.window_label
        : '5h'
  const resetsAt =
    typeof record.resetsAt === 'string'
      ? record.resetsAt
      : typeof record.resets_at === 'string'
        ? record.resets_at
        : null

  if (usedPercent == null || !resetsAt) return null
  return { usedPercent, window: windowLabel, resetsAt }
}

export async function fetchCodexUsage(): Promise<ProviderQuota> {
  const fetchedAt = new Date().toISOString()
  const fetchImpl = createHttpFetch()
  const url = `${resolveGatewayBaseUrl()}/v1/usage/codex`

  const response = await fetchImpl(url, {
    method: 'GET',
    headers: await gatewayAuthHeaders(),
  })

  if (!response.ok) {
    const body = await response.text()
    throw new Error(`Codex usage HTTP ${response.status}: ${body.slice(0, 160)}`)
  }

  const payload = (await response.json()) as Record<string, unknown>
  return {
    id: 'codex',
    label: 'Codex',
    available: Boolean(payload.available ?? true),
    primary: parseWindow(payload.primary),
    detail: typeof payload.detail === 'string' ? payload.detail : undefined,
    fetchedAt,
  }
}
