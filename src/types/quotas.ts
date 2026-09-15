export interface QuotaWindow {
  usedPercent: number
  window: string
  resetsAt: string
}

export interface ProviderQuota {
  id: string
  label: string
  available: boolean
  primary: QuotaWindow | null
  detail?: string
  fetchedAt: string
}
