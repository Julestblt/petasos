import { AppBootstrap } from '@/components/layout/app-bootstrap'
import { AppShell } from '@/components/layout/app-shell'
import { ApprovalDialog } from '@/components/approval/approval-dialog'

export default function App() {
  return (
    <>
      <AppBootstrap />
      <AppShell />
      <ApprovalDialog />
    </>
  )
}
