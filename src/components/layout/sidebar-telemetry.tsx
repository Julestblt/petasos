import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { formatPct, formatReset, formatUsedGb } from '@/lib/format'
import { cn } from '@/lib/utils'
import { useConnectionStore } from '@/stores/connectionStore'
import { useHostMetricsStore } from '@/stores/hostMetricsStore'
import { useQuotasStore } from '@/stores/quotasStore'
import type { ProviderQuota } from '@/types/quotas'
import { ChevronRight, Cpu, Monitor, Server } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

function CodexMark({ className }: { className?: string }) {
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

function providerMark(id: string) {
  if (id === 'opencode-go') {
    return <OpenCodeMark className="size-3.5" />
  }
  return <CodexMark className="size-3.5" />
}

export function SidebarTelemetry() {
  const providers = useQuotasStore((state) => state.providers)
  const metrics = useHostMetricsStore((state) => state.metrics)
  const hermes = useConnectionStore((state) => state.hermes)
  const llm = useConnectionStore((state) => state.llm)
  const navigate = useNavigate()
  const visible = providers.filter(
    (provider) => provider.primary || !provider.available,
  )
  const onlineCount = [hermes === 'online', llm === 'online'].filter(Boolean).length

  return (
    <div className="space-y-3 px-1">
      <section>
        <div className="mb-2 flex items-center justify-between px-1">
          <span className="text-[11px] text-muted-foreground">Quotas</span>
          <span className="text-[11px] text-muted-foreground">Rolling</span>
        </div>
        {visible.length === 0 ? (
          <p className="px-1 text-[11px] text-muted-foreground">via gateway</p>
        ) : (
          <div className="grid grid-cols-2 gap-2">
            {visible.map((provider) => (
              <QuotaMeter key={provider.id} provider={provider} />
            ))}
          </div>
        )}
      </section>

      <section>
        <div className="mb-1.5 flex items-center justify-between px-1">
          <span className="text-[11px] text-muted-foreground">Host</span>
        </div>
        <div className="flex items-center gap-2 rounded-md px-1 py-1">
          <Monitor className="size-3.5 shrink-0 text-muted-foreground" />
          <span
            className={cn(
              'size-1.5 shrink-0 rounded-full',
              metrics?.online ? 'bg-foreground' : 'bg-muted-foreground/40',
            )}
          />
          <span className="min-w-0 flex-1 truncate text-xs">
            {metrics?.name ?? 'homelab'}
          </span>
          <span className="font-mono text-[10px] text-muted-foreground tabular-nums">
            {formatUsedGb(metrics?.ramUsedGb ?? null)} {formatPct(metrics?.cpuPercent)}{' '}
            {formatPct(metrics?.diskPercent)}
          </span>
        </div>
      </section>

      <section>
        <Button
          type="button"
          variant="ghost"
          className="h-auto w-full justify-between px-1 py-1.5 text-[11px] text-muted-foreground hover:text-foreground"
          onClick={() => navigate('/status')}
        >
          <span className="flex items-center gap-1.5">
            Servers
            <ChevronRight className="size-3" />
          </span>
          <span className="flex items-center gap-2 font-mono tabular-nums">
            {onlineCount}/2 online
            <Server className="size-3" />
          </span>
        </Button>
        <div className="mt-0.5 flex items-center gap-3 px-1 text-[10px] text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <Cpu className="size-3" />
            Gateway {hermes}
          </span>
          <span>Models {llm}</span>
        </div>
      </section>
    </div>
  )
}

function QuotaMeter({ provider }: { provider: ProviderQuota }) {
  const pct = provider.primary
    ? Math.max(0, Math.min(100, provider.primary.usedPercent))
    : null
  const hot = pct != null && pct >= 95

  return (
    <div className={cn('min-w-0 px-1', hot && 'text-destructive')}>
      <div className="flex items-baseline gap-1.5">
        <span className="text-foreground">{providerMark(provider.id)}</span>
        <span className="text-sm leading-none font-medium tracking-tight">
          {pct == null ? '—' : `${Math.round(pct)}%`}
        </span>
      </div>
      <div className="mt-0.5 text-[10px] text-muted-foreground">
        {provider.primary ? formatReset(provider.primary.resetsAt) : '—'}
      </div>
      <Progress
        value={pct ?? 0}
        className={cn('mt-1.5 h-0.5', hot && 'bg-destructive/20')}
      />
    </div>
  )
}
