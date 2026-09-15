import { useEffect } from 'react'
import { METRICS_POLL_INTERVAL_MS } from '@/lib/constants'
import { useHostMetricsStore } from '@/stores/hostMetricsStore'

export function useHostMetrics(enabled = true) {
  const refresh = useHostMetricsStore((state) => state.refresh)

  useEffect(() => {
    if (!enabled) return
    void refresh()
    const timer = window.setInterval(() => {
      void refresh()
    }, METRICS_POLL_INTERVAL_MS)
    return () => window.clearInterval(timer)
  }, [enabled, refresh])
}
