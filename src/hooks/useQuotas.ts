import { useEffect } from 'react'
import {
  CODEX_USAGE_URL,
  OPENCODE_GO_API_KEY,
  QUOTAS_POLL_INTERVAL_MS,
} from '@/lib/constants'
import { useQuotasStore } from '@/stores/quotasStore'

export function useQuotas(enabled = true) {
  const refresh = useQuotasStore((state) => state.refresh)
  const configured = CODEX_USAGE_URL.length > 0 || OPENCODE_GO_API_KEY.length > 0

  useEffect(() => {
    if (!enabled || !configured) return
    void refresh().catch(() => undefined)
    const timer = window.setInterval(() => {
      void refresh().catch(() => undefined)
    }, QUOTAS_POLL_INTERVAL_MS)
    return () => window.clearInterval(timer)
  }, [configured, enabled, refresh])
}
