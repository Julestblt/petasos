import {
  HERMES_API_KEY,
  hostLabelFromHermesUrl,
  resolveHermesBaseUrl,
  resolveHostMetricsUrl,
} from '@/lib/constants'
import { createHttpFetch } from '@/lib/http'
import type { HostMetrics } from '@/types/metrics'

function emptyMetrics(detail: string): HostMetrics {
  return {
    id: 'host',
    name: hostLabelFromHermesUrl(),
    online: false,
    cpuPercent: null,
    ramUsedGb: null,
    ramTotalGb: null,
    diskPercent: null,
    source: 'unavailable',
    updatedAt: new Date().toISOString(),
    detail,
  }
}

function normalizePayload(payload: Record<string, unknown>): HostMetrics {
  const ramUsed =
    typeof payload.ramUsedGb === 'number'
      ? payload.ramUsedGb
      : typeof payload.mem_used_gb === 'number'
        ? payload.mem_used_gb
        : null
  const ramTotal =
    typeof payload.ramTotalGb === 'number'
      ? payload.ramTotalGb
      : typeof payload.mem_total_gb === 'number'
        ? payload.mem_total_gb
        : null

  return {
    id: String(payload.id ?? payload.name ?? 'host'),
    name: String(payload.name ?? hostLabelFromHermesUrl()),
    online: Boolean(payload.online ?? true),
    cpuPercent:
      typeof payload.cpuPercent === 'number'
        ? payload.cpuPercent
        : typeof payload.cpu_percent === 'number'
          ? payload.cpu_percent
          : null,
    ramUsedGb: ramUsed,
    ramTotalGb: ramTotal,
    diskPercent:
      typeof payload.diskPercent === 'number'
        ? payload.diskPercent
        : typeof payload.disk_percent === 'number'
          ? payload.disk_percent
          : null,
    source: 'metrics-api',
    updatedAt:
      typeof payload.updatedAt === 'string'
        ? payload.updatedAt
        : new Date().toISOString(),
    detail: typeof payload.detail === 'string' ? payload.detail : undefined,
  }
}

async function fetchFromMetricsApi(url: string): Promise<HostMetrics> {
  const fetchImpl = createHttpFetch()
  const response = await fetchImpl(url, {
    method: 'GET',
    headers: { Accept: 'application/json' },
  })

  if (!response.ok) {
    throw new Error(`Metrics HTTP ${response.status}`)
  }

  const payload = (await response.json()) as Record<string, unknown>
  if (Array.isArray(payload.hosts) && payload.hosts[0]) {
    return normalizePayload(payload.hosts[0] as Record<string, unknown>)
  }
  return normalizePayload(payload)
}

async function fetchPartialFromHermes(): Promise<HostMetrics> {
  const fetchImpl = createHttpFetch()
  const baseUrl = resolveHermesBaseUrl()
  const response = await fetchImpl(`${baseUrl}/health/detailed`, {
    method: 'GET',
    headers: {
      Accept: 'application/json',
      Authorization: `Bearer ${HERMES_API_KEY}`,
    },
  })

  if (!response.ok) {
    throw new Error(`Hermes detailed HTTP ${response.status}`)
  }

  const payload = (await response.json()) as {
    status?: string
    readiness?: {
      checks?: {
        disk?: { used_percent?: number; status?: string }
      }
    }
  }

  const diskPercent = payload.readiness?.checks?.disk?.used_percent ?? null
  const online = payload.status === 'ok' || payload.status === 'healthy'

  return {
    id: 'hermes-host',
    name: hostLabelFromHermesUrl(),
    online,
    cpuPercent: null,
    ramUsedGb: null,
    ramTotalGb: null,
    diskPercent,
    source: 'hermes-partial',
    updatedAt: new Date().toISOString(),
    detail: 'Disk from Hermes · CPU/RAM need metrics API',
  }
}

export async function fetchHostMetrics(): Promise<HostMetrics> {
  const metricsUrl = resolveHostMetricsUrl()

  if (metricsUrl) {
    try {
      return await fetchFromMetricsApi(metricsUrl)
    } catch (error) {
      const detail = error instanceof Error ? error.message : 'metrics unreachable'
      try {
        const partial = await fetchPartialFromHermes()
        return { ...partial, detail: `${detail} · fallback Hermes disk` }
      } catch {
        return emptyMetrics(detail)
      }
    }
  }

  try {
    return await fetchPartialFromHermes()
  } catch (error) {
    return emptyMetrics(error instanceof Error ? error.message : 'unavailable')
  }
}
