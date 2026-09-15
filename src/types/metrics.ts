export interface HostMetrics {
  id: string
  name: string
  online: boolean
  cpuPercent: number | null
  ramUsedGb: number | null
  ramTotalGb: number | null
  diskPercent: number | null
  source: 'metrics-api' | 'hermes-partial' | 'unavailable'
  updatedAt: string
  detail?: string
}
