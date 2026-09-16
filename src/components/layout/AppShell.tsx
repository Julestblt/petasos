import { BrandMark } from '@/components/brand/BrandMark'
import { OperatorIdentity } from '@/components/layout/OperatorIdentity'
import { ServerStrip } from '@/components/layout/ServerStrip'
import { cn } from '@/lib/utils'
import { useConnectionStore } from '@/stores/connectionStore'
import { useUiStore } from '@/stores/uiStore'
import type { AppView, ConnectionState } from '@/types/hermes'
import { Activity, BookOpen, MessageSquare } from 'lucide-react'
import type { ReactNode } from 'react'

const NAV: Array<{ id: AppView; label: string; icon: typeof MessageSquare }> = [
  { id: 'console', label: 'Chat', icon: MessageSquare },
  { id: 'status', label: 'Status', icon: Activity },
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

  return (
    <div className="flex h-svh overflow-hidden bg-background text-foreground">
      <aside className="flex w-14 shrink-0 flex-col items-center border-r border-border bg-sidebar py-3">
        <BrandMark size={28} className="mb-4 shrink-0" />
        <nav className="flex flex-1 flex-col items-center gap-1">
          {NAV.map((item) => {
            const Icon = item.icon
            const active = view === item.id
            return (
              <button
                key={item.id}
                type="button"
                title={item.label}
                onClick={() => setView(item.id)}
                className={cn(
                  'flex h-10 w-10 items-center justify-center rounded-lg transition-colors',
                  active
                    ? 'bg-foreground text-background'
                    : 'text-muted-foreground hover:bg-accent hover:text-foreground',
                )}
              >
                <Icon className="h-4 w-4" />
              </button>
            )
          })}
        </nav>
        <div className="mt-auto flex flex-col items-center gap-3 pb-2">
          <div className="flex flex-col items-center gap-2" title="Gateway">
            <Dot state={hermes} />
          </div>
          <div className="flex flex-col items-center gap-2" title="Models">
            <Dot state={llm} />
          </div>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        {view === 'console' ? (
          <main className="min-h-0 flex-1 overflow-hidden">{children}</main>
        ) : (
          <>
            <header className="flex h-12 items-center justify-between border-b border-border px-5">
              <div className="text-sm text-muted-foreground">
                {view === 'status' ? 'Connection' : 'Skills'}
              </div>
            </header>
            <main className="min-h-0 flex-1 overflow-hidden">{children}</main>
            {view === 'status' ? (
              <div className="border-t border-border">
                <div className="grid grid-cols-[1fr_auto] items-stretch">
                  <ServerStrip />
                  <div className="border-l border-border">
                    <OperatorIdentity />
                  </div>
                </div>
              </div>
            ) : null}
          </>
        )}
      </div>
    </div>
  )
}
