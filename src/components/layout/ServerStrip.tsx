import { cn } from '@/lib/utils'
import { useHostMetricsStore } from '@/stores/hostMetricsStore'

function formatRam(used: number | null, total: number | null): string {
  if (used == null) return '—'
  if (total == null) return `${Math.round(used)} G`
  return `${Math.round(used)}/${Math.round(total)} G`
}

function formatPercent(value: number | null): string {
  if (value == null) return '—'
  return `${Math.round(value)}%`
}

export function ServerStrip() {
  const metrics = useHostMetricsStore((state) => state.metrics)

  return (
    <div className="border-t border-border px-4 py-3">
      <div className="mb-2 flex items-center justify-between gap-2">
        <div className="truncate text-xs font-medium text-foreground">
          {metrics?.name ?? 'Server'}
        </div>
        <span
          className={cn(
            'h-1.5 w-1.5 shrink-0 rounded-full',
            metrics?.online ? 'bg-foreground' : 'bg-muted-foreground/50',
          )}
        />
      </div>
      <div className="grid grid-cols-3 gap-2 font-mono text-[11px] tracking-tight text-muted-foreground">
        <Metric label="CPU" value={formatPercent(metrics?.cpuPercent ?? null)} />
        <Metric
          label="RAM"
          value={formatRam(metrics?.ramUsedGb ?? null, metrics?.ramTotalGb ?? null)}
        />
        <Metric label="DISK" value={formatPercent(metrics?.diskPercent ?? null)} />
      </div>
      {metrics?.source === 'hermes-partial' || metrics?.source === 'unavailable' ? (
        <div className="mt-2 text-[10px] leading-snug text-muted-foreground/80">
          {metrics.detail ?? 'Connect a metrics API for CPU/RAM'}
        </div>
      ) : null}
    </div>
  )
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0">
      <div className="text-[10px] text-muted-foreground/70">{label}</div>
      <div className="truncate text-foreground">{value}</div>
    </div>
  )
}
