import { useEffect } from 'react'
import { useMissionControlStore } from '@/stores/missionControlStore'

export function useMissionControl(enabled = true) {
  const refresh = useMissionControlStore((state) => state.refresh)

  useEffect(() => {
    if (!enabled) return
    void refresh().catch(() => undefined)
  }, [enabled, refresh])
}
