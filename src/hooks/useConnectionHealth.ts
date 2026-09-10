import { useEffect } from 'react'
import { HEALTH_POLL_INTERVAL_MS } from '@/lib/constants'
import { useConnectionStore } from '@/stores/connectionStore'

export function useConnectionHealth(enabled = true) {
  const refresh = useConnectionStore((state) => state.refresh)

  useEffect(() => {
    if (!enabled) return

    void refresh()
    const timer = window.setInterval(() => {
      void refresh()
    }, HEALTH_POLL_INTERVAL_MS)

    return () => window.clearInterval(timer)
  }, [enabled, refresh])
}
