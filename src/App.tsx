import { AppShell } from '@/components/layout/AppShell'
import { ApprovalModal } from '@/components/approval/ApprovalModal'
import { useConnectionHealth } from '@/hooks/useConnectionHealth'
import { useHostMetrics } from '@/hooks/useHostMetrics'
import { useModelPolicy } from '@/hooks/useModelPolicy'
import { useQuotas } from '@/hooks/useQuotas'
import { useUiStore } from '@/stores/uiStore'
import { ConsoleView } from '@/views/ConsoleView'
import { SkillsView } from '@/views/SkillsView'
import { StatusView } from '@/views/StatusView'

export default function App() {
  useConnectionHealth()
  useHostMetrics()
  useQuotas()
  useModelPolicy()
  const view = useUiStore((state) => state.view)

  return (
    <AppShell>
      {view === 'status' ? <StatusView /> : null}
      {view === 'console' ? <ConsoleView /> : null}
      {view === 'skills' ? <SkillsView /> : null}
      <ApprovalModal />
    </AppShell>
  )
}
