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
import { hermesClient } from '@/services/hermesClient'
import { useApprovalStore } from '@/stores/approvalStore'

export function ApprovalModal() {
  const pending = useApprovalStore((state) => state.pending)
  const resolving = useApprovalStore((state) => state.resolving)
  const setResolving = useApprovalStore((state) => state.setResolving)
  const clear = useApprovalStore((state) => state.clear)

  async function resolve(decision: 'approve' | 'deny') {
    if (!pending) return
    setResolving(true)
    try {
      await hermesClient.resolveApproval(pending.runId, decision, {
        request_id: pending.id,
      })
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
              'A critical Hermes action is waiting for a human decision.'}
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

        <DialogFooter>
          <Button
            variant="outline"
            disabled={resolving}
            onClick={() => void resolve('deny')}
          >
            Deny
          </Button>
          <Button disabled={resolving} onClick={() => void resolve('approve')}>
            Approve
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
