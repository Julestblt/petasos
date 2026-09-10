import { ScrollArea } from '@/components/ui/scroll-area'
import { formatRelativeTime } from '@/lib/utils'
import { useTimelineStore } from '@/stores/timelineStore'
import type { TimelineEvent } from '@/types/hermes'
import { cn } from '@/lib/utils'

export function ExecutionTimeline() {
  const events = useTimelineStore((state) => state.events)

  return (
    <div className="flex h-full flex-col bg-sidebar/40">
      <div className="border-b border-border/80 px-4 py-3">
        <div className="text-sm font-medium">Execution Timeline</div>
        <div className="text-xs text-muted-foreground">
          Live tool calls, sub-agents, and run lifecycle
        </div>
      </div>
      <ScrollArea className="flex-1">
        <div className="space-y-3 p-4">
          {events.length === 0 ? (
            <div className="rounded-lg border border-dashed border-border/80 px-3 py-8 text-center text-xs text-muted-foreground">
              Timeline events from the Hermes run SSE stream will appear here.
            </div>
          ) : (
            [...events].reverse().map((event) => (
              <TimelineEventItem key={event.id} event={event} />
            ))
          )}
        </div>
      </ScrollArea>
    </div>
  )
}

function TimelineEventItem({ event }: { event: TimelineEvent }) {
  return (
    <div className="rounded-lg border border-border/70 bg-card/50 px-3 py-2.5">
      <div className="flex items-start justify-between gap-3">
        <div className="text-sm font-medium leading-snug">{event.title}</div>
        <div className="shrink-0 text-[10px] uppercase tracking-wide text-muted-foreground">
          {formatRelativeTime(event.createdAt)}
        </div>
      </div>
      <div
        className={cn(
          'mt-1 text-[11px] uppercase tracking-[0.14em] text-muted-foreground',
        )}
      >
        {event.kind}
      </div>
      {event.detail ? (
        <pre className="mt-2 max-h-28 overflow-auto whitespace-pre-wrap rounded-md bg-zinc-950/70 p-2 text-[11px] text-zinc-300">
          {event.detail}
        </pre>
      ) : null}
    </div>
  )
}
