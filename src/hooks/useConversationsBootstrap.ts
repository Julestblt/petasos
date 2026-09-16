import { useEffect } from 'react'
import { useConversationsStore } from '@/stores/conversationsStore'

export function useConversationsBootstrap(enabled = true) {
  const refresh = useConversationsStore((state) => state.refresh)
  const select = useConversationsStore((state) => state.select)

  useEffect(() => {
    if (!enabled) return
    void (async () => {
      await refresh().catch(() => undefined)
      const id = useConversationsStore.getState().activeId
      if (id) {
        await select(id).catch(() => undefined)
      }
    })()
  }, [enabled, refresh, select])
}
