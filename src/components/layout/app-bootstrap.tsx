import { useConnectionHealth } from '@/hooks/useConnectionHealth'
import { useConversationsBootstrap } from '@/hooks/useConversationsBootstrap'
import { useHostMetrics } from '@/hooks/useHostMetrics'
import { useModelCatalog } from '@/hooks/useModelCatalog'
import { useQuotas } from '@/hooks/useQuotas'

export function AppBootstrap() {
  useConnectionHealth()
  useHostMetrics()
  useQuotas()
  useModelCatalog()
  useConversationsBootstrap()
  return null
}
