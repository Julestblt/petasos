import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'
import { useQuotasStore } from '@/stores/quotasStore'
import type { ProviderQuota, QuotaWindow } from '@/types/quotas'

function formatReset(iso: string): string {
  const resetAt = new Date(iso).getTime()
  if (Number.isNaN(resetAt)) return iso
  const delta = Math.max(0, resetAt - Date.now())
  const hours = Math.floor(delta / 3_600_000)
  const days = Math.floor(hours / 24)
  if (days >= 1) return `${days}d`
  if (hours >= 1) return `${hours}h`
  const minutes = Math.max(1, Math.floor(delta / 60_000))
  return `${minutes}m`
}

function OpenAiMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden
      className={cn('shrink-0 fill-current', className)}
    >
      <path d="M22.282 9.821a5.985 5.985 0 0 0-.516-4.91 6.046 6.046 0 0 0-6.51-2.9A6.065 6.065 0 0 0 4.981 4.18a5.985 5.985 0 0 0-3.998 2.9 6.046 6.046 0 0 0 .743 7.097 5.98 5.98 0 0 0 .51 4.911 6.051 6.051 0 0 0 6.515 2.9A5.985 5.985 0 0 0 13.26 24a6.056 6.056 0 0 0 5.774-4.206 5.99 5.99 0 0 0 3.997-2.9 6.056 6.056 0 0 0-.747-7.073zM13.26 22.43a4.476 4.476 0 0 1-2.876-1.04l.141-.081 4.779-2.758a.795.795 0 0 0 .392-.681v-6.737l2.02 1.168a.071.071 0 0 1 .038.052v5.583a4.504 4.504 0 0 1-4.494 4.494zM3.6 18.304a4.47 4.47 0 0 1-.535-3.014l.142.085 4.783 2.759a.771.771 0 0 0 .78 0l5.843-3.368v2.332a.08.08 0 0 1-.033.062L9.74 19.95a4.5 4.5 0 0 1-6.14-1.646zM2.34 7.896a4.507 4.507 0 0 1 2.353-1.974V11.6a.766.766 0 0 0 .388.676l5.815 3.355-2.02 1.168a.076.076 0 0 1-.071 0l-4.83-2.786A4.504 4.504 0 0 1 2.34 7.872zm16.597 3.855-5.844-3.369L15.119 7.2a.076.076 0 0 1 .071 0l4.83 2.791a4.494 4.494 0 0 1-.676 8.105v-5.677a.79.79 0 0 0-.407-.667zm2.01-3.023-.141-.085-4.784-2.782a.776.776 0 0 0-.785 0L9.409 9.23V6.897a.066.066 0 0 1 .028-.061l4.83-2.787a4.5 4.5 0 0 1 6.68 4.66zm-12.64 4.135-2.02-1.164a.08.08 0 0 1-.038-.057V6.075a4.5 4.5 0 0 1 7.375-3.453l-.146.087-4.778 2.758a.794.794 0 0 0-.393.681zm1.097-2.365 2.602-1.5 2.607 1.5v2.999l-2.597 1.5-2.607-1.5z" />
    </svg>
  )
}

function OpenCodeMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 240 300"
      aria-hidden
      className={cn('shrink-0 fill-current', className)}
    >
      <path
        fillRule="evenodd"
        d="M240 0H0v300h240V0ZM180 60H60v180h120V60Z"
      />
    </svg>
  )
}

function providerMark(id: string, className?: string): ReactNode {
  if (id === 'opencode-go') {
    return <OpenCodeMark className={cn('h-4 w-3.5', className)} />
  }
  return <OpenAiMark className={cn('h-4 w-4', className)} />
}

export function QuotasStrip() {
  const providers = useQuotasStore((state) => state.providers)
  const error = useQuotasStore((state) => state.error)
  const visible = providers.filter((provider) => provider.primary || !provider.available)

  return (
    <div className="border-t border-border px-4 py-3">
      <div className="mb-3 flex items-center justify-between gap-2">
        <div className="text-xs font-medium text-foreground">Quotas</div>
        <div className="text-[10px] text-muted-foreground">5h</div>
      </div>

      {visible.length === 0 ? (
        <div className="text-[10px] leading-snug text-muted-foreground">
          {error ?? 'Quotas via gateway'}
        </div>
      ) : (
        <div className="flex items-stretch">
          {visible.map((provider, index) => (
            <QuotaColumn
              key={provider.id}
              provider={provider}
              mark={providerMark(provider.id, 'text-current')}
              divided={index < visible.length - 1}
            />
          ))}
        </div>
      )}
    </div>
  )
}

function QuotaColumn({
  provider,
  mark,
  divided,
}: {
  provider: ProviderQuota
  mark: ReactNode
  divided: boolean
}) {
  const window: QuotaWindow | null = provider.primary
  const pct = window ? Math.max(0, Math.min(100, window.usedPercent)) : null
  const hot = pct != null && pct >= 95

  return (
    <div
      className={cn(
        'min-w-0 flex-1 space-y-2 px-2 first:pl-0 last:pr-0',
        divided && 'border-r border-border',
      )}
    >
      <div
        className={cn(
          'flex flex-col items-center gap-1.5 text-center',
          hot ? 'text-amber-500' : 'text-foreground',
        )}
      >
        {mark}
        <div className="font-display text-lg leading-none tracking-tight">
          {pct == null ? '—' : `${Math.round(pct)}%`}
        </div>
        <div className="font-mono text-[10px] text-muted-foreground">
          {window ? formatReset(window.resetsAt) : '—'}
        </div>
      </div>
      <div className="h-0.5 w-full bg-border">
        <div
          className={cn(
            'h-full transition-[width] duration-300',
            hot ? 'bg-amber-500' : 'bg-foreground',
          )}
          style={{ width: `${pct ?? 0}%` }}
        />
      </div>
    </div>
  )
}
