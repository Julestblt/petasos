import { Lightbulb } from 'lucide-react'
import { useState } from 'react'
import { cn } from '@/lib/utils'
import type { ThinkingItem } from '@/types/hermes'

export function ThinkingPanel({ items }: { items: ThinkingItem[] }) {
  const [open, setOpen] = useState(false)
  if (items.length === 0) return null

  const latest = items[items.length - 1]
  const label = latest.toolName
    ? `Thinking · ${latest.toolName}`
    : 'Thinking…'

  return (
    <div className="mb-3 overflow-hidden rounded-lg border border-border/80 bg-secondary/40">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs text-muted-foreground transition-colors hover:text-foreground"
      >
        <Lightbulb className="h-3.5 w-3.5 shrink-0 text-amber-400/90" />
        <span className="truncate font-medium">{label}</span>
        <span className="ml-auto tabular-nums opacity-70">{items.length}</span>
      </button>
      {open ? (
        <div className="space-y-2 border-t border-border/60 px-3 py-2">
          {items.map((item) => (
            <div key={item.id} className="text-[11px] leading-snug text-muted-foreground">
              <div className={cn('font-medium text-foreground/80')}>
                {item.toolName ?? item.title}
              </div>
              {item.detail ? (
                <pre className="mt-1 max-h-28 overflow-auto whitespace-pre-wrap font-mono text-[10px] opacity-80">
                  {item.detail.slice(0, 800)}
                </pre>
              ) : null}
            </div>
          ))}
        </div>
      ) : null}
    </div>
  )
}
