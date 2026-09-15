import { create } from 'zustand'
import { fetchHostMetrics } from '@/services/hostMetricsService'
import type { HostMetrics } from '@/types/metrics'

interface HostMetricsStore {
  metrics?: HostMetrics
  loading: boolean
  error?: string
  refresh: () => Promise<HostMetrics>
}

export const useHostMetricsStore = create<HostMetricsStore>((set) => ({
  loading: false,
  refresh: async () => {
    set({ loading: true, error: undefined })
    try {
      const metrics = await fetchHostMetrics()
      set({ metrics, loading: false })
      return metrics
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Metrics failed'
      set({ loading: false, error: message })
      throw error
    }
  },
}))
