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

function tone(state: ConnectionState): string {
  switch (state) {
    case 'online':
      return 'border-emerald-500/30 text-emerald-300'
    case 'degraded':
      return 'border-amber-500/30 text-amber-300'
    case 'offline':
      return 'border-rose-500/30 text-rose-300'
    default:
      return 'border-border text-muted-foreground'
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
    <div className="mx-auto flex h-full max-w-4xl flex-col gap-6 overflow-auto p-6">
      <div className="space-y-2">
        <h1 className="font-display text-3xl tracking-tight">Connection</h1>
        <p className="max-w-2xl text-sm text-muted-foreground">
          Verify the Hermes gateway before opening the console.
          {PROBE_OLLAMA
            ? ' Local Ollama probing is enabled.'
            : ' Model availability is read from Hermes `/v1/models`.'}
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <Server className="h-4 w-4 text-muted-foreground" />
                <CardTitle>Hermes Gateway</CardTitle>
              </div>
              <Badge className={cn(tone(hermes))}>{labelFor(hermes)}</Badge>
            </div>
            <CardDescription className="break-all">{HERMES_BASE_URL}</CardDescription>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            {hermesDetail ?? 'Waiting for first probe…'}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-muted-foreground" />
                <CardTitle>{PROBE_OLLAMA ? 'Local LLM' : 'Model'}</CardTitle>
              </div>
              <Badge className={cn(tone(llm))}>{labelFor(llm)}</Badge>
            </div>
            <CardDescription className="break-all">
              {PROBE_OLLAMA ? OLLAMA_BASE_URL : 'via Hermes API'}
            </CardDescription>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            {llmDetail ?? 'Waiting for first probe…'}
          </CardContent>
        </Card>
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
