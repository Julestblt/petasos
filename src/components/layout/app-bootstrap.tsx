import { useMissionControl } from '@/hooks/useMissionControl'
import { useConnectionHealth } from '@/hooks/useConnectionHealth'
import { useConversationsBootstrap } from '@/hooks/useConversationsBootstrap'
import { useHostMetrics } from '@/hooks/useHostMetrics'
import { useQuotas } from '@/hooks/useQuotas'

export function AppBootstrap() {
  useMissionControl()
  useConnectionHealth()
  useHostMetrics()
  useQuotas()
  useConversationsBootstrap()
  return null
}
