import { useEffect } from 'react'
import { QUOTAS_POLL_INTERVAL_MS } from '@/lib/constants'
import { useQuotasStore } from '@/stores/quotasStore'

export function useQuotas(enabled = true) {
  const refresh = useQuotasStore((state) => state.refresh)

  useEffect(() => {
    if (!enabled) return
    void refresh().catch(() => undefined)
    const timer = window.setInterval(() => {
      void refresh().catch(() => undefined)
    }, QUOTAS_POLL_INTERVAL_MS)
    return () => window.clearInterval(timer)
  }, [enabled, refresh])
}
