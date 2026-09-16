import { useEffect } from 'react'
import { useModelCatalogStore } from '@/stores/modelCatalogStore'

export function useModelCatalog(enabled = true) {
  const refresh = useModelCatalogStore((state) => state.refresh)

  useEffect(() => {
    if (!enabled) return
    void refresh().catch(() => undefined)
  }, [enabled, refresh])
}
