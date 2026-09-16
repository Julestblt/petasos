import { hostLabelFromGatewayUrl, resolveGatewayBaseUrl } from '@/lib/constants'
import { createHttpFetch } from '@/lib/http'
import { gatewayAuthHeaders } from '@/services/gatewayAuth'
import type { HostMetrics } from '@/types/metrics'

function emptyMetrics(detail: string): HostMetrics {
  return {
    id: 'host',
    name: hostLabelFromGatewayUrl(),
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

function bytesToGb(value: number): number {
  return value / 1024 ** 3
}

function pickRootFs(entries: unknown): number | null {
  if (!Array.isArray(entries) || entries.length === 0) return null

  const typed = entries as Array<{
    mnt_point?: string
    percent?: number
    size?: number
  }>

  const preferred =
    typed.find((item) => item.mnt_point === '/') ??
    typed.find((item) => item.mnt_point === '/home') ??
    [...typed].sort((a, b) => (b.size ?? 0) - (a.size ?? 0))[0]

  return typeof preferred?.percent === 'number' ? preferred.percent : null
}

export async function fetchHostMetrics(): Promise<HostMetrics> {
  const fetchImpl = createHttpFetch()
  const baseUrl = resolveGatewayBaseUrl()

  try {
    const response = await fetchImpl(`${baseUrl}/v1/metrics/overview`, {
      method: 'GET',
      headers: await gatewayAuthHeaders(),
    })

    if (!response.ok) {
      throw new Error(`Metrics HTTP ${response.status}`)
    }

    const payload = (await response.json()) as {
      data?: {
        status?: { hostname?: string }
        cpu?: { total?: number }
        mem?: { used?: number; total?: number }
        fs?: unknown
      }
      unavailable?: string[]
    }

    const data = payload.data ?? {}
    const unavailable = payload.unavailable ?? []
    const online = Boolean(data.cpu || data.mem || data.fs)

    return {
      id: 'gateway-metrics',
      name: data.status?.hostname ?? hostLabelFromGatewayUrl(),
      online,
      cpuPercent: typeof data.cpu?.total === 'number' ? data.cpu.total : null,
      ramUsedGb: typeof data.mem?.used === 'number' ? bytesToGb(data.mem.used) : null,
      ramTotalGb: typeof data.mem?.total === 'number' ? bytesToGb(data.mem.total) : null,
      diskPercent: pickRootFs(data.fs),
      source: 'metrics-api',
      updatedAt: new Date().toISOString(),
      detail:
        unavailable.length > 0
          ? `Gateway · unavailable: ${unavailable.join(', ')}`
          : 'Gateway',
    }
  } catch (error) {
    return emptyMetrics(error instanceof Error ? error.message : 'metrics unavailable')
  }
}
