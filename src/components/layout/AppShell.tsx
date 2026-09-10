import type { ReactNode } from 'react'
import {
  Activity,
  BookOpen,
  PanelLeftClose,
  PanelLeftOpen,
  Radio,
  TerminalSquare,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { cn } from '@/lib/utils'
import { useConnectionStore } from '@/stores/connectionStore'
import { useTimelineStore } from '@/stores/timelineStore'
import { useUiStore } from '@/stores/uiStore'
import type { AppView, ConnectionState } from '@/types/hermes'

const NAV: Array<{ id: AppView; label: string; icon: typeof Radio }> = [
  { id: 'status', label: 'Status', icon: Radio },
  { id: 'console', label: 'Console', icon: TerminalSquare },
  { id: 'skills', label: 'Skills', icon: BookOpen },
]

function statusColor(state: ConnectionState): string {
  switch (state) {
    case 'online':
      return 'bg-emerald-400'
    case 'degraded':
      return 'bg-amber-400'
    case 'offline':
      return 'bg-rose-400'
    default:
      return 'bg-zinc-500'
  }
}

export function AppShell({ children }: { children: ReactNode }) {
  const view = useUiStore((state) => state.view)
  const setView = useUiStore((state) => state.setView)
  const hermes = useConnectionStore((state) => state.hermes)
  const llm = useConnectionStore((state) => state.llm)
  const collapsed = useTimelineStore((state) => state.collapsed)
  const toggleCollapsed = useTimelineStore((state) => state.toggleCollapsed)

  return (
    <div className="flex h-svh overflow-hidden bg-background text-foreground">
      <aside className="flex w-56 shrink-0 flex-col border-r border-border/80 bg-sidebar/80">
        <div className="px-5 py-5">
          <div className="text-[11px] font-medium uppercase tracking-[0.22em] text-muted-foreground">
            Mission Control
          </div>
          <div className="mt-2 font-display text-2xl tracking-tight text-foreground">
            Petasos
          </div>
        </div>

        <Separator />

        <nav className="flex flex-1 flex-col gap-1 p-3">
          {NAV.map((item) => {
            const Icon = item.icon
            const active = view === item.id
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setView(item.id)}
                className={cn(
                  'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors',
                  active
                    ? 'bg-accent text-accent-foreground'
                    : 'text-muted-foreground hover:bg-accent/60 hover:text-foreground',
                )}
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </button>
            )
          })}
        </nav>

        <div className="space-y-3 border-t border-border/80 p-4">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>Hermes</span>
            <span className={cn('h-2 w-2 rounded-full', statusColor(hermes))} />
          </div>
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>LLM</span>
            <span className={cn('h-2 w-2 rounded-full', statusColor(llm))} />
          </div>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-14 items-center justify-between border-b border-border/80 px-5">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Activity className="h-4 w-4" />
            <span>Observability for a sandboxed Hermes agent</span>
          </div>
          {view === 'console' ? (
            <Button variant="ghost" size="sm" onClick={toggleCollapsed}>
              {collapsed ? (
                <>
                  <PanelLeftOpen className="h-4 w-4" />
                  Timeline
                </>
              ) : (
                <>
                  <PanelLeftClose className="h-4 w-4" />
                  Hide timeline
                </>
              )}
            </Button>
          ) : null}
        </header>
        <main className="min-h-0 flex-1 overflow-hidden">{children}</main>
      </div>
    </div>
  )
}
