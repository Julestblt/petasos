import type { ReactNode } from 'react'
import { RefreshCw, Server, Sparkles } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  HERMES_BASE_URL,
  OLLAMA_BASE_URL,
  PROBE_OLLAMA,
} from '@/lib/constants'
import { cn, formatRelativeTime } from '@/lib/utils'
import { useConnectionStore } from '@/stores/connectionStore'
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

export function ConnectionStatus() {
  const hermes = useConnectionStore((state) => state.hermes)
  const llm = useConnectionStore((state) => state.llm)
  const hermesDetail = useConnectionStore((state) => state.hermesDetail)
  const llmDetail = useConnectionStore((state) => state.llmDetail)
  const checkedAt = useConnectionStore((state) => state.checkedAt)
  const checking = useConnectionStore((state) => state.checking)
  const refresh = useConnectionStore((state) => state.refresh)

  return (
    <div className="mx-auto flex h-full max-w-3xl flex-col gap-8 overflow-auto p-8">
      <div className="space-y-2">
        <h1 className="font-display text-3xl tracking-[-0.04em]">Connection</h1>
        <p className="max-w-xl text-sm text-muted-foreground">
          Gateway and model readiness for the linked Hermes instance.
        </p>
      </div>

      <div className="divide-y divide-border border border-border">
        <StatusRow
          icon={<Server className="h-4 w-4" />}
          title="Hermes"
          subtitle={HERMES_BASE_URL}
          state={hermes}
          detail={hermesDetail}
        />
        <StatusRow
          icon={<Sparkles className="h-4 w-4" />}
          title={PROBE_OLLAMA ? 'Local LLM' : 'Model'}
          subtitle={PROBE_OLLAMA ? OLLAMA_BASE_URL : 'via Hermes API'}
          state={llm}
          detail={llmDetail}
        />
      </div>

      <div className="flex items-center gap-3">
        <Button onClick={() => void refresh()} disabled={checking}>
          <RefreshCw className={cn('h-4 w-4', checking && 'animate-spin')} />
          Refresh
        </Button>
        <span className="text-xs text-muted-foreground">
          {checkedAt ? `Checked ${formatRelativeTime(checkedAt)}` : 'Not checked yet'}
        </span>
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
    <div className="flex items-start justify-between gap-4 bg-card/40 px-5 py-4">
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
      <Badge
        className={cn(
          'shrink-0 rounded-none border-border',
          state === 'online' && 'bg-foreground text-background',
          state === 'degraded' && 'bg-transparent text-foreground',
          state === 'offline' && 'bg-transparent text-muted-foreground',
          state === 'unknown' && 'bg-transparent text-muted-foreground',
        )}
      >
        {labelFor(state)}
      </Badge>
    </div>
  )
}
