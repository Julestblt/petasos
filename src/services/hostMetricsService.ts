import {
  HERMES_API_KEY,
  hostLabelFromHermesUrl,
  resolveHermesBaseUrl,
  resolveHostMetricsUrl,
} from '@/lib/constants'
import { createHttpFetch } from '@/lib/http'
import { glancesFetch } from '@/services/glancesAuth'
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

function bytesToGb(value: number): number {
  return value / 1024 ** 3
}

function isGlancesApiUrl(url: string): boolean {
  return (
    url === '/__metrics' ||
    /\/api\/\d+\/?$/.test(url) ||
    url.includes('/api/4') ||
    url.includes('/api/3')
  )
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

async function fetchFromGlances(): Promise<HostMetrics> {
  const [cpuRes, memRes, fsRes, systemRes] = await Promise.all([
    glancesFetch('/cpu'),
    glancesFetch('/mem'),
    glancesFetch('/fs'),
    glancesFetch('/system'),
  ])

  if (!cpuRes.ok || !memRes.ok) {
    throw new Error(`Glances HTTP cpu=${cpuRes.status} mem=${memRes.status}`)
  }

  const cpu = (await cpuRes.json()) as { total?: number }
  const mem = (await memRes.json()) as {
    used?: number
    total?: number
  }
  const fs = fsRes.ok ? ((await fsRes.json()) as unknown) : []
  const system = systemRes.ok
    ? ((await systemRes.json()) as { hostname?: string })
    : {}

  return {
    id: 'glances',
    name: system.hostname ?? hostLabelFromHermesUrl(),
    online: true,
    cpuPercent: typeof cpu.total === 'number' ? cpu.total : null,
    ramUsedGb: typeof mem.used === 'number' ? bytesToGb(mem.used) : null,
    ramTotalGb: typeof mem.total === 'number' ? bytesToGb(mem.total) : null,
    diskPercent: pickRootFs(fs),
    source: 'metrics-api',
    updatedAt: new Date().toISOString(),
    detail: 'Glances',
  }
}

async function fetchFromMetricsApi(url: string): Promise<HostMetrics> {
  if (isGlancesApiUrl(url)) {
    return fetchFromGlances()
  }

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
    detail: 'Disk from Hermes · run Glances for CPU/RAM',
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
