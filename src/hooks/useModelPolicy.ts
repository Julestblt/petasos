import { useEffect } from 'react'
import { useModelModeStore } from '@/stores/modelModeStore'

export function useModelPolicy(enabled = true) {
  const refresh = useModelModeStore((state) => state.refresh)

  useEffect(() => {
    if (!enabled) return
    void refresh().catch(() => undefined)
  }, [enabled, refresh])
}
