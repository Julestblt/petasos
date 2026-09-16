import { useEffect, useMemo, useState, type ReactNode } from 'react'
import {
  Cpu,
  HardDrive,
  MemoryStick,
  Network,
  RefreshCw,
  Server,
  Sparkles,
  Wrench,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import { GATEWAY_BASE_URL } from '@/lib/constants'
import { formatPct, formatRam, formatReset } from '@/lib/format'
import { cn, formatRelativeTime } from '@/lib/utils'
import { gatewayClient } from '@/services/gatewayClient'
import { useConnectionStore } from '@/stores/connectionStore'
import { useHostMetricsStore } from '@/stores/hostMetricsStore'
import { useModelCatalogStore } from '@/stores/modelCatalogStore'
import { useQuotasStore } from '@/stores/quotasStore'
import type { ConnectionState, HermesToolset } from '@/types/hermes'
import type { ProviderQuota } from '@/types/quotas'

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

function stripEmoji(label: string): string {
  return label.replace(/^\p{Extended_Pictographic}\s*/u, '').trim() || label
}

export function StatusPage() {
  const hermes = useConnectionStore((state) => state.hermes)
  const llm = useConnectionStore((state) => state.llm)
  const hermesDetail = useConnectionStore((state) => state.hermesDetail)
  const llmDetail = useConnectionStore((state) => state.llmDetail)
  const checkedAt = useConnectionStore((state) => state.checkedAt)
  const checking = useConnectionStore((state) => state.checking)
  const refreshHealth = useConnectionStore((state) => state.refresh)

  const metrics = useHostMetricsStore((state) => state.metrics)
  const refreshMetrics = useHostMetricsStore((state) => state.refresh)

  const models = useModelCatalogStore((state) => state.models)
  const refreshModels = useModelCatalogStore((state) => state.refresh)

  const providers = useQuotasStore((state) => state.providers)
  const refreshQuotas = useQuotasStore((state) => state.refresh)

  const [toolsets, setToolsets] = useState<HermesToolset[]>([])
  const [toolsetsError, setToolsetsError] = useState<string>()
  const [toolsetsLoading, setToolsetsLoading] = useState(false)
  const [refreshing, setRefreshing] = useState(false)

  async function loadToolsets() {
    setToolsetsLoading(true)
    setToolsetsError(undefined)
    try {
      const items = await gatewayClient.listHermesToolsets()
      setToolsets(items)
    } catch (error) {
      setToolsetsError(
        error instanceof Error ? error.message : 'Failed to load toolsets',
      )
    } finally {
      setToolsetsLoading(false)
    }
  }

  useEffect(() => {
    void loadToolsets()
  }, [])

  async function refreshAll() {
    setRefreshing(true)
    await Promise.allSettled([
      refreshHealth(),
      refreshMetrics(),
      refreshModels(),
      refreshQuotas(),
      loadToolsets(),
    ])
    setRefreshing(false)
  }

  const providerGroups = useMemo(() => {
    const map = new Map<string, number>()
    for (const model of models) {
      const key = model.provider_label || model.provider || 'Other'
      map.set(key, (map.get(key) ?? 0) + 1)
    }
    return [...map.entries()].sort((a, b) => a[0].localeCompare(b[0]))
  }, [models])

  const enabledToolsets = toolsets.filter((item) => item.enabled && item.configured)
  const busy = refreshing || checking

  return (
    <div className="h-full overflow-auto p-6">
      <div className="mx-auto flex max-w-5xl flex-col gap-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="flex flex-col gap-1">
            <h1 className="font-display text-2xl tracking-tight">Status</h1>
            <p className="text-sm text-muted-foreground">
              Homelab pulse through the gateway — services, host, quotas, agent surface.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs text-muted-foreground">
              {checkedAt ? `Checked ${formatRelativeTime(checkedAt)}` : 'Not checked yet'}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => void refreshAll()}
              disabled={busy}
            >
              <RefreshCw className={cn('size-4', busy && 'animate-spin')} />
              Refresh
            </Button>
          </div>
        </div>

        <section className="flex flex-col gap-3">
          <SectionLabel>Services</SectionLabel>
          <div className="grid gap-3 sm:grid-cols-2">
            <ServiceCard
              icon={<Server className="size-4" />}
              title="Gateway"
              subtitle={GATEWAY_BASE_URL.replace(/^https?:\/\//, '')}
              state={hermes}
              detail={hermesDetail}
            />
            <ServiceCard
              icon={<Sparkles className="size-4" />}
              title="Models"
              subtitle={`${models.length} allowed`}
              state={llm}
              detail={llmDetail}
            />
          </div>
        </section>

        <section className="flex flex-col gap-3">
          <div className="flex items-center justify-between gap-3">
            <SectionLabel>Host</SectionLabel>
            <span className="font-mono text-xs text-muted-foreground">
              {metrics?.name ?? 'homelab'}
              {metrics?.cpuCores != null ? ` · ${metrics.cpuCores} cores` : ''}
            </span>
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            <MetricCard
              icon={<Cpu className="size-4" />}
              label="CPU"
              value={formatPct(metrics?.cpuPercent ?? null)}
              progress={metrics?.cpuPercent ?? null}
            />
            <MetricCard
              icon={<MemoryStick className="size-4" />}
              label="RAM"
              value={formatRam(metrics?.ramUsedGb ?? null, metrics?.ramTotalGb ?? null)}
              progress={metrics?.ramPercent ?? null}
              hint={
                metrics?.ramPercent != null
                  ? formatPct(metrics.ramPercent)
                  : undefined
              }
            />
            <MetricCard
              icon={<HardDrive className="size-4" />}
              label="Disk"
              value={formatPct(metrics?.diskPercent ?? null)}
              progress={metrics?.diskPercent ?? null}
            />
          </div>
          {metrics && !metrics.online ? (
            <p className="text-xs text-muted-foreground">
              {metrics.detail ?? 'Host metrics unavailable'}
            </p>
          ) : null}
        </section>

        <section className="flex flex-col gap-3">
          <SectionLabel>Quotas</SectionLabel>
          <div className="grid gap-3 sm:grid-cols-2">
            {providers.length === 0 ? (
              <Card className="sm:col-span-2">
                <CardContent className="py-6 text-sm text-muted-foreground">
                  Quota meters load from the gateway usage routes.
                </CardContent>
              </Card>
            ) : (
              providers.map((provider) => (
                <QuotaCard key={provider.id} provider={provider} />
              ))
            )}
          </div>
        </section>

        <div className="grid gap-6 lg:grid-cols-2">
          <section className="flex flex-col gap-3">
            <div className="flex items-center justify-between gap-3">
              <SectionLabel>Model catalogue</SectionLabel>
              <Badge variant="secondary">{models.length}</Badge>
            </div>
            <Card>
              <CardContent className="flex flex-col gap-0 py-2">
                {providerGroups.length === 0 ? (
                  <p className="px-4 py-4 text-sm text-muted-foreground">
                    No models returned by the gateway allowlist.
                  </p>
                ) : (
                  providerGroups.map(([label, count], index) => (
                    <div key={label}>
                      {index > 0 ? <Separator /> : null}
                      <div className="flex items-center justify-between gap-3 px-4 py-3">
                        <span className="truncate text-sm">{label}</span>
                        <span className="font-mono text-xs text-muted-foreground">
                          {count}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          </section>

          <section className="flex flex-col gap-3">
            <div className="flex items-center justify-between gap-3">
              <SectionLabel>Hermes toolsets</SectionLabel>
              <Badge variant="secondary">
                {enabledToolsets.length}/{toolsets.length || '—'}
              </Badge>
            </div>
            <Card>
              <CardContent className="flex flex-col gap-0 py-2">
                {toolsetsLoading && toolsets.length === 0 ? (
                  <div className="flex flex-col gap-2 px-4 py-3">
                    <Skeleton className="h-4 w-2/3" />
                    <Skeleton className="h-4 w-1/2" />
                    <Skeleton className="h-4 w-3/4" />
                  </div>
                ) : null}
                {toolsetsError ? (
                  <p className="px-4 py-4 text-sm text-destructive">{toolsetsError}</p>
                ) : null}
                {!toolsetsLoading && !toolsetsError && toolsets.length === 0 ? (
                  <p className="px-4 py-4 text-sm text-muted-foreground">
                    No toolsets reported.
                  </p>
                ) : null}
                {toolsets.map((toolset, index) => (
                  <div key={toolset.id}>
                    {index > 0 ? <Separator /> : null}
                    <div className="flex items-start gap-3 px-4 py-3">
                      <Wrench className="mt-0.5 size-3.5 shrink-0 text-muted-foreground" />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="truncate text-sm font-medium">
                            {stripEmoji(toolset.label)}
                          </span>
                          <Badge
                            variant={
                              toolset.enabled && toolset.configured
                                ? 'default'
                                : 'outline'
                            }
                            className="shrink-0"
                          >
                            {toolset.enabled && toolset.configured
                              ? 'Ready'
                              : 'Off'}
                          </Badge>
                        </div>
                        <p className="mt-0.5 font-mono text-[11px] text-muted-foreground">
                          {toolset.tools.length} tools
                          {toolset.description ? ` · ${toolset.description}` : ''}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </section>
        </div>

        <section className="flex flex-col gap-3">
          <SectionLabel>Tailnet</SectionLabel>
          <Card className="border-dashed">
            <CardHeader className="gap-3">
              <div className="flex items-start gap-3">
                <div className="flex size-9 shrink-0 items-center justify-center rounded-lg border bg-muted/50">
                  <Network className="size-4 text-muted-foreground" />
                </div>
                <div className="flex flex-col gap-1">
                  <CardTitle className="text-base">Machines not wired yet</CardTitle>
                  <CardDescription className="text-sm leading-relaxed">
                    Tailscale exposes{' '}
                    <span className="font-mono text-xs">
                      GET /api/v2/tailnet/&#123;tailnet&#125;/devices
                    </span>
                    . Petasos will not call it directly — the API key stays on the host.
                    Add a dedicated gateway route (for example{' '}
                    <span className="font-mono text-xs">GET /v1/tailnet/devices</span>
                    ) to list online machines here.
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
          </Card>
        </section>
      </div>
    </div>
  )
}

function SectionLabel({ children }: { children: string }) {
  return (
    <h2 className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
      {children}
    </h2>
  )
}

function ServiceCard({
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
    <Card className="gap-0 py-0">
      <CardHeader className="gap-4 px-5 py-5">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex size-9 items-center justify-center rounded-lg border bg-muted/50 text-muted-foreground">
              {icon}
            </div>
            <div className="flex flex-col gap-0.5">
              <CardTitle className="text-sm">{title}</CardTitle>
              <CardDescription className="truncate font-mono text-[11px]">
                {subtitle}
              </CardDescription>
            </div>
          </div>
          <Badge variant={badgeVariant(state)}>{labelFor(state)}</Badge>
        </div>
        <p className="text-sm leading-relaxed text-muted-foreground">
          {detail ?? 'Waiting for first probe…'}
        </p>
      </CardHeader>
    </Card>
  )
}

function MetricCard({
  icon,
  label,
  value,
  progress,
  hint,
}: {
  icon: ReactNode
  label: string
  value: string
  progress: number | null
  hint?: string
}) {
  return (
    <Card className="gap-0 py-0">
      <CardHeader className="gap-4 px-5 py-5">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 text-muted-foreground">
            {icon}
            <span className="text-xs font-medium tracking-wide uppercase">{label}</span>
          </div>
          {hint ? (
            <span className="font-mono text-[11px] text-muted-foreground">{hint}</span>
          ) : null}
        </div>
        <div className="font-mono text-2xl tracking-tight">{value}</div>
        <Progress value={progress ?? 0} className="h-1.5" />
      </CardHeader>
    </Card>
  )
}

function QuotaCard({ provider }: { provider: ProviderQuota }) {
  const primary = provider.primary
  return (
    <Card className="gap-0 py-0">
      <CardHeader className="gap-4 px-5 py-5">
        <div className="flex items-center justify-between gap-3">
          <CardTitle className="text-sm">{provider.label}</CardTitle>
          <Badge variant={provider.available ? 'secondary' : 'outline'}>
            {provider.available ? 'Rolling' : 'Unavailable'}
          </Badge>
        </div>
        {primary ? (
          <>
            <div className="flex items-end justify-between gap-3">
              <div className="font-mono text-2xl tracking-tight">
                {Math.round(primary.usedPercent)}%
              </div>
              <div className="text-right text-xs text-muted-foreground">
                <div>{primary.window}</div>
                <div>resets {formatReset(primary.resetsAt)}</div>
              </div>
            </div>
            <Progress value={primary.usedPercent} className="h-1.5" />
          </>
        ) : (
          <p className="text-sm text-muted-foreground">
            {provider.detail ?? 'No quota window from gateway.'}
          </p>
        )}
      </CardHeader>
    </Card>
  )
}
