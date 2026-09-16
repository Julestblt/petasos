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
import { useApprovalStore } from '@/stores/approvalStore'

export function ApprovalModal() {
  const pending = useApprovalStore((state) => state.pending)
  const clear = useApprovalStore((state) => state.clear)

  return (
    <Dialog open={Boolean(pending)} onOpenChange={(open) => !open && clear()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ShieldAlert className="h-5 w-5 text-amber-300" />
            Approval unavailable
          </DialogTitle>
          <DialogDescription>
            The homelab gateway does not expose Hermes approval routes. Resolve
            the run on the host if it is waiting for a decision.
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
          <Button onClick={clear}>Dismiss</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
