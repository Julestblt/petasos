import { useMemo, type ReactNode } from 'react'
import {
  AlertTriangle,
  BookOpen,
  Cpu,
  HardDrive,
  MemoryStick,
  Network,
  RefreshCw,
  Server,
  Sparkles,
  Wrench,
} from 'lucide-react'
import { Link } from 'react-router-dom'
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
import { useConnectionStore } from '@/stores/connectionStore'
import { useHostMetricsStore } from '@/stores/hostMetricsStore'
import { useMissionControlStore } from '@/stores/missionControlStore'
import { useQuotasStore } from '@/stores/quotasStore'
import type { ConnectionState, HermesToolset } from '@/types/hermes'
import type { ProviderQuota } from '@/types/quotas'

const FEATURE_LABELS: Array<{ key: string; label: string }> = [
  { key: 'run_steer', label: 'Steer' },
  { key: 'run_stop', label: 'Stop' },
  { key: 'run_approval_response', label: 'Approvals' },
  { key: 'run_events_sse', label: 'Run SSE' },
  { key: 'tool_progress_events', label: 'Tool progress' },
  { key: 'skills_api', label: 'Skills' },
  { key: 'session_fork', label: 'Fork' },
  { key: 'session_chat_streaming', label: 'Chat stream' },
]

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

function toolsetTone(
  toolset: HermesToolset,
): 'default' | 'secondary' | 'outline' {
  if (toolset.enabled && toolset.configured) return 'default'
  if (toolset.enabled) return 'secondary'
  return 'outline'
}

function toolsetLabel(toolset: HermesToolset): string {
  if (toolset.enabled && toolset.configured) return 'Ready'
  if (toolset.enabled && !toolset.configured) return 'Needs config'
  if (!toolset.enabled && toolset.configured) return 'Disabled'
  return 'Off'
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

  const overview = useMissionControlStore((state) => state.overview)
  const mcLoading = useMissionControlStore((state) => state.loading)
  const mcError = useMissionControlStore((state) => state.error)
  const refreshMissionControl = useMissionControlStore((state) => state.refresh)

  const providers = useQuotasStore((state) => state.providers)
  const refreshQuotas = useQuotasStore((state) => state.refresh)

  const models = overview?.models.items ?? []
  const skills = overview?.skills.items ?? []
  const toolsets = overview?.toolsets.items ?? []
  const capabilities = overview?.capabilities.items

  const providerGroups = useMemo(() => {
    const map = new Map<string, number>()
    for (const model of models) {
      const key = model.provider_label || model.provider || 'Other'
      map.set(key, (map.get(key) ?? 0) + 1)
    }
    return [...map.entries()].sort((a, b) => a[0].localeCompare(b[0]))
  }, [models])

  const skillGroups = useMemo(() => {
    const map = new Map<string, number>()
    for (const skill of skills) {
      map.set(skill.category, (map.get(skill.category) ?? 0) + 1)
    }
    return [...map.entries()].sort((a, b) => a[0].localeCompare(b[0]))
  }, [skills])

  const featureRows = FEATURE_LABELS.map((item) => ({
    ...item,
    on: Boolean(capabilities?.features[item.key]),
  }))

  const busy = checking || mcLoading

  async function refreshAll() {
    await Promise.allSettled([
      refreshHealth(),
      refreshMetrics(),
      refreshMissionControl(),
      refreshQuotas(),
    ])
  }

  return (
    <div className="h-full overflow-auto p-6">
      <div className="mx-auto flex max-w-5xl flex-col gap-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2">
              <h1 className="font-display text-2xl tracking-tight">Status</h1>
              {overview ? (
                <Badge variant="outline">
                  {overview.source === 'overview' ? 'Mission Control' : 'Legacy assemble'}
                </Badge>
              ) : null}
            </div>
            <p className="text-sm text-muted-foreground">
              Cockpit snapshot from the gateway — partial outages stay local alerts.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs text-muted-foreground">
              {overview?.fetchedAt
                ? `Snapshot ${formatRelativeTime(overview.fetchedAt)}`
                : checkedAt
                  ? `Checked ${formatRelativeTime(checkedAt)}`
                  : 'Not checked yet'}
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

        {mcError ? <SectionAlert message={mcError} /> : null}

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
              subtitle={
                overview?.models.available
                  ? `${models.length} allowed`
                  : 'Unavailable'
              }
              state={overview?.models.available === false ? 'degraded' : llm}
              detail={
                overview?.models.available === false
                  ? overview.models.detail
                  : llmDetail
              }
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
            {!overview?.models.available && overview ? (
              <SectionAlert
                message={overview.models.detail ?? 'Models section unavailable'}
              />
            ) : null}
            <Card>
              <CardContent className="flex flex-col gap-0 py-2">
                {mcLoading && models.length === 0 ? (
                  <div className="flex flex-col gap-2 px-4 py-3">
                    <Skeleton className="h-4 w-2/3" />
                    <Skeleton className="h-4 w-1/2" />
                  </div>
                ) : null}
                {providerGroups.length === 0 && !mcLoading ? (
                  <p className="px-4 py-4 text-sm text-muted-foreground">
                    No models in the gateway allowlist.
                  </p>
                ) : null}
                {providerGroups.map(([label, count], index) => (
                  <div key={label}>
                    {index > 0 ? <Separator /> : null}
                    <div className="flex items-center justify-between gap-3 px-4 py-3">
                      <span className="truncate text-sm">{label}</span>
                      <span className="font-mono text-xs text-muted-foreground">
                        {count}
                      </span>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </section>

          <section className="flex flex-col gap-3">
            <div className="flex items-center justify-between gap-3">
              <SectionLabel>Capabilities</SectionLabel>
              <Badge variant="secondary">
                {featureRows.filter((item) => item.on).length}/{featureRows.length}
              </Badge>
            </div>
            {!overview?.capabilities.available && overview ? (
              <SectionAlert
                message={
                  overview.capabilities.detail ?? 'Capabilities section unavailable'
                }
              />
            ) : null}
            <Card>
              <CardHeader className="gap-1 pb-2">
                <CardTitle className="text-sm">
                  {capabilities?.platform ?? 'Hermes'}
                </CardTitle>
                <CardDescription className="font-mono text-[11px]">
                  {capabilities?.model ?? 'No model label'}
                </CardDescription>
              </CardHeader>
              <CardContent className="flex flex-wrap gap-2 pb-5">
                {featureRows.map((item) => (
                  <Badge
                    key={item.key}
                    variant={item.on ? 'default' : 'outline'}
                  >
                    {item.label}
                  </Badge>
                ))}
              </CardContent>
            </Card>
          </section>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <section className="flex flex-col gap-3">
            <div className="flex items-center justify-between gap-3">
              <SectionLabel>Hermes toolsets</SectionLabel>
              <Badge variant="secondary">
                {toolsets.filter((item) => item.enabled && item.configured).length}/
                {toolsets.length || '—'}
              </Badge>
            </div>
            {!overview?.toolsets.available && overview ? (
              <SectionAlert
                message={overview.toolsets.detail ?? 'Toolsets section unavailable'}
              />
            ) : null}
            <Card>
              <CardContent className="flex flex-col gap-0 py-2">
                {mcLoading && toolsets.length === 0 ? (
                  <div className="flex flex-col gap-2 px-4 py-3">
                    <Skeleton className="h-4 w-2/3" />
                    <Skeleton className="h-4 w-1/2" />
                  </div>
                ) : null}
                {!mcLoading && toolsets.length === 0 ? (
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
                            variant={toolsetTone(toolset)}
                            className="shrink-0"
                          >
                            {toolsetLabel(toolset)}
                          </Badge>
                        </div>
                        <p className="mt-0.5 font-mono text-[11px] text-muted-foreground">
                          {toolset.enabled ? 'enabled' : 'disabled'} ·{' '}
                          {toolset.configured ? 'configured' : 'not configured'} ·{' '}
                          {toolset.tools.length} tools
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </section>

          <section className="flex flex-col gap-3">
            <div className="flex items-center justify-between gap-3">
              <SectionLabel>Skills</SectionLabel>
              <div className="flex items-center gap-2">
                <Badge variant="secondary">{skills.length}</Badge>
                <Button asChild size="sm" variant="ghost">
                  <Link to="/skills">Open</Link>
                </Button>
              </div>
            </div>
            {!overview?.skills.available && overview ? (
              <SectionAlert
                message={overview.skills.detail ?? 'Skills section unavailable'}
              />
            ) : null}
            <Card>
              <CardContent className="flex flex-col gap-0 py-2">
                {skillGroups.length === 0 ? (
                  <p className="px-4 py-4 text-sm text-muted-foreground">
                    No skills in the Mission Control snapshot.
                  </p>
                ) : (
                  skillGroups.map(([category, count], index) => (
                    <div key={category}>
                      {index > 0 ? <Separator /> : null}
                      <div className="flex items-center gap-3 px-4 py-3">
                        <BookOpen className="size-3.5 text-muted-foreground" />
                        <span className="min-w-0 flex-1 truncate text-sm">
                          {category}
                        </span>
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
                    Needs a dedicated gateway route such as{' '}
                    <span className="font-mono text-xs">GET /v1/tailnet/devices</span>.
                    Petasos will not call the Tailscale API from the client.
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

function SectionAlert({ message }: { message: string }) {
  return (
    <div className="flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
      <AlertTriangle className="mt-0.5 size-4 shrink-0" />
      <span>{message}</span>
    </div>
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
