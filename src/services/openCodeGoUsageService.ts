import { OPENCODE_GO_API_KEY, resolveOpenCodeGoUsageUrl } from '@/lib/constants'
import { createHttpFetch } from '@/lib/http'
import type { ProviderQuota, QuotaWindow } from '@/types/quotas'

function parseRolling(value: unknown): QuotaWindow | null {
  if (!value || typeof value !== 'object') return null
  const record = value as Record<string, unknown>
  const usedPercent =
    typeof record.percent === 'number'
      ? record.percent
      : typeof record.usedPercent === 'number'
        ? record.usedPercent
        : typeof record.usage_percent === 'number'
          ? record.usage_percent
          : null
  const resetsAt =
    typeof record.resetsAt === 'string'
      ? record.resetsAt
      : typeof record.resets_at === 'string'
        ? record.resets_at
        : null

  if (usedPercent == null || !resetsAt) return null
  return { usedPercent, window: '5h', resetsAt }
}

export async function fetchOpenCodeGoUsage(): Promise<ProviderQuota> {
  const url = resolveOpenCodeGoUsageUrl()
  const fetchedAt = new Date().toISOString()

  if (!url) {
    return {
      id: 'opencode-go',
      label: 'OpenCode Go',
      available: false,
      primary: null,
      detail: 'OPENCODE_GO_USAGE_URL is not configured',
      fetchedAt,
    }
  }

  if (!OPENCODE_GO_API_KEY) {
    return {
      id: 'opencode-go',
      label: 'OpenCode Go',
      available: false,
      primary: null,
      detail: 'OPENCODE_GO_API_KEY is not configured',
      fetchedAt,
    }
  }

  const fetchImpl = createHttpFetch()
  const response = await fetchImpl(url, {
    method: 'GET',
    headers: {
      Accept: 'application/json',
      Authorization: `Bearer ${OPENCODE_GO_API_KEY}`,
    },
    redirect: 'error',
  })

  if (!response.ok) {
    const body = await response.text()
    throw new Error(`OpenCode Go usage HTTP ${response.status}: ${body.slice(0, 160)}`)
  }

  const payload = (await response.json()) as {
    usage?: {
      rolling?: unknown
      weekly?: unknown
      monthly?: unknown
    }
  }

  return {
    id: 'opencode-go',
    label: 'OpenCode Go',
    available: true,
    primary: parseRolling(payload.usage?.rolling),
    fetchedAt,
  }
}
