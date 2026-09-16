import type { ReactNode } from 'react'
import { RefreshCw, Server, Sparkles } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { GATEWAY_BASE_URL } from '@/lib/constants'
import { formatPct, formatRam } from '@/lib/format'
import { formatRelativeTime } from '@/lib/utils'
import { useConnectionStore } from '@/stores/connectionStore'
import { useHostMetricsStore } from '@/stores/hostMetricsStore'
import type { ConnectionState } from '@/types/hermes'

function labelFor(state: ConnectionState): string {
  switch (state) {
    case 'online':
      return 'Online'
    case 'degraded':
      return 'Degraded'
    case 'offline':
      return 'Offline'
    default:
      return 'Checking'
  }
}

function badgeVariant(
  state: ConnectionState,
): 'default' | 'secondary' | 'outline' | 'destructive' {
  if (state === 'online') return 'default'
  if (state === 'offline') return 'destructive'
  return 'outline'
}

export function StatusPage() {
  const hermes = useConnectionStore((state) => state.hermes)
  const llm = useConnectionStore((state) => state.llm)
  const hermesDetail = useConnectionStore((state) => state.hermesDetail)
  const llmDetail = useConnectionStore((state) => state.llmDetail)
  const checkedAt = useConnectionStore((state) => state.checkedAt)
  const checking = useConnectionStore((state) => state.checking)
  const refresh = useConnectionStore((state) => state.refresh)
  const metrics = useHostMetricsStore((state) => state.metrics)

  return (
    <div className="h-full overflow-auto p-6">
      <div className="mx-auto flex max-w-3xl flex-col gap-6">
        <div className="space-y-1">
          <h1 className="font-display text-2xl tracking-tight">Status</h1>
          <p className="text-sm text-muted-foreground">
            Gateway health, model catalogue, and host metrics from homelab-gateway.
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Services</CardTitle>
            <CardDescription>{GATEWAY_BASE_URL}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <StatusRow
              icon={<Server className="size-4" />}
              title="Gateway"
              subtitle="GET /health"
              state={hermes}
              detail={hermesDetail}
            />
            <StatusRow
              icon={<Sparkles className="size-4" />}
              title="Models"
              subtitle="GET /v1/models"
              state={llm}
              detail={llmDetail}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Host</CardTitle>
            <CardDescription>{metrics?.name ?? 'homelab'}</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-3 gap-4 font-mono text-sm">
            <Metric label="CPU" value={formatPct(metrics?.cpuPercent ?? null)} />
            <Metric
              label="RAM"
              value={formatRam(metrics?.ramUsedGb ?? null, metrics?.ramTotalGb ?? null)}
            />
            <Metric label="Disk" value={formatPct(metrics?.diskPercent ?? null)} />
          </CardContent>
        </Card>

        <div className="flex items-center gap-3">
          <Button onClick={() => void refresh()} disabled={checking}>
            <RefreshCw className={checking ? 'size-4 animate-spin' : 'size-4'} />
            Refresh
          </Button>
          <span className="text-xs text-muted-foreground">
            {checkedAt ? `Checked ${formatRelativeTime(checkedAt)}` : 'Not checked yet'}
          </span>
        </div>
      </div>
    </div>
  )
}

function StatusRow({
  icon,
  title,
  subtitle,
  state,
  detail,
}: {
  icon: ReactNode
  title: string
  subtitle: string
  state: ConnectionState
  detail?: string
}) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div className="min-w-0 space-y-1">
        <div className="flex items-center gap-2 text-sm font-medium">
          <span className="text-muted-foreground">{icon}</span>
          {title}
        </div>
        <div className="truncate text-xs text-muted-foreground">{subtitle}</div>
        <div className="text-sm text-muted-foreground">
          {detail ?? 'Waiting for first probe…'}
        </div>
      </div>
      <Badge variant={badgeVariant(state)}>{labelFor(state)}</Badge>
    </div>
  )
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-[11px] text-muted-foreground">{label}</div>
      <div className="mt-1">{value}</div>
    </div>
  )
}
