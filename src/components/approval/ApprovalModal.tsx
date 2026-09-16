import { ShieldAlert } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { gatewayClient } from '@/services/gatewayClient'
import { useApprovalStore } from '@/stores/approvalStore'
import type { ApprovalChoice } from '@/types/hermes'

export function ApprovalModal() {
  const pending = useApprovalStore((state) => state.pending)
  const resolving = useApprovalStore((state) => state.resolving)
  const setResolving = useApprovalStore((state) => state.setResolving)
  const clear = useApprovalStore((state) => state.clear)

  async function resolve(choice: ApprovalChoice) {
    if (!pending) return
    setResolving(true)
    try {
      await gatewayClient.resolveApproval(pending.runId, choice)
      clear()
    } catch {
      setResolving(false)
    }
  }

  return (
    <Dialog open={Boolean(pending)} onOpenChange={(open) => !open && clear()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ShieldAlert className="h-5 w-5 text-amber-300" />
            Approval required
          </DialogTitle>
          <DialogDescription>
            {pending?.description ??
              'Hermes is waiting for a manual decision before continuing.'}
          </DialogDescription>
        </DialogHeader>

        <div className="rounded-lg border border-border/80 bg-zinc-950/60 p-3 text-sm">
          <div className="text-xs uppercase tracking-[0.16em] text-muted-foreground">
            {pending?.toolName ?? 'action'}
          </div>
          <pre className="mt-2 max-h-48 overflow-auto whitespace-pre-wrap text-xs text-zinc-300">
            {JSON.stringify(pending?.payload ?? {}, null, 2)}
          </pre>
        </div>

        <DialogFooter className="flex-wrap gap-2 sm:justify-end">
          <Button
            variant="outline"
            disabled={resolving}
            onClick={() => void resolve('deny')}
          >
            Deny
          </Button>
          <Button
            variant="outline"
            disabled={resolving}
            onClick={() => void resolve('once')}
          >
            Once
          </Button>
          <Button
            variant="outline"
            disabled={resolving}
            onClick={() => void resolve('session')}
          >
            Session
          </Button>
          <Button disabled={resolving} onClick={() => void resolve('always')}>
            Always
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
