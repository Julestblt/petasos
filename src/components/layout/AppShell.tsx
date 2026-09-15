import { BrandMark } from '@/components/brand/BrandMark'
import { OperatorIdentity } from '@/components/layout/OperatorIdentity'
import { QuotasStrip } from '@/components/layout/QuotasStrip'
import { ServerStrip } from '@/components/layout/ServerStrip'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { useConnectionStore } from '@/stores/connectionStore'
import { useTimelineStore } from '@/stores/timelineStore'
import { useUiStore } from '@/stores/uiStore'
import type { AppView, ConnectionState } from '@/types/hermes'
import {
  BookOpen,
  PanelRightClose,
  PanelRightOpen,
  Radio,
  TerminalSquare,
} from 'lucide-react'
import type { ReactNode } from 'react'

const NAV: Array<{ id: AppView; label: string; icon: typeof Radio }> = [
  { id: 'status', label: 'Status', icon: Radio },
  { id: 'console', label: 'Console', icon: TerminalSquare },
  { id: 'skills', label: 'Skills', icon: BookOpen },
]

function Dot({ state }: { state: ConnectionState }) {
  return (
    <span
      className={cn(
        'h-1.5 w-1.5 rounded-full',
        state === 'online'
          ? 'bg-foreground'
          : state === 'degraded'
            ? 'bg-foreground/50'
            : 'bg-muted-foreground/40',
      )}
    />
  )
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
      <aside className="flex w-[15.5rem] shrink-0 flex-col border-r border-border bg-sidebar">
        <div className="px-4 pb-4 pt-5">
          <div className="flex items-center gap-2.5">
            <BrandMark size={30} className="shrink-0" />
            <div className="min-w-0">
              <div className="font-display text-[1.45rem] leading-none tracking-[-0.04em]">
                Petasos
              </div>
            </div>
          </div>
        </div>

        <nav className="flex flex-1 flex-col gap-0.5 px-2">
          {NAV.map((item) => {
            const Icon = item.icon
            const active = view === item.id
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setView(item.id)}
                className={cn(
                  'flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors',
                  active
                    ? 'bg-foreground text-background'
                    : 'text-muted-foreground hover:bg-accent hover:text-foreground',
                )}
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </button>
            )
          })}
        </nav>

        <div className="mt-auto">
          <QuotasStrip />
          <div className="space-y-2 border-t border-border px-4 py-3">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>Hermes</span>
              <Dot state={hermes} />
            </div>
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>Model</span>
              <Dot state={llm} />
            </div>
          </div>
          <ServerStrip />
          <div className="border-t border-border">
            <OperatorIdentity />
          </div>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-12 items-center justify-between border-b border-border px-5">
          <div className="text-sm text-muted-foreground">
            {view === 'status'
              ? 'Connection'
              : view === 'console'
                ? 'Console'
                : 'Skills'}
          </div>
          {view === 'console' ? (
            <Button variant="ghost" size="sm" onClick={toggleCollapsed}>
              {collapsed ? (
                <>
                  <PanelRightOpen className="h-4 w-4" />
                  Timeline
                </>
              ) : (
                <>
                  <PanelRightClose className="h-4 w-4" />
                  Hide
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
