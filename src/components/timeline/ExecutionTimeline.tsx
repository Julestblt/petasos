import { ScrollArea } from '@/components/ui/scroll-area'
import { formatRelativeTime } from '@/lib/utils'
import { useTimelineStore } from '@/stores/timelineStore'
import type { TimelineEvent } from '@/types/hermes'
import { cn } from '@/lib/utils'

export function ExecutionTimeline() {
  const events = useTimelineStore((state) => state.events)

  return (
    <div className="flex h-full flex-col bg-sidebar">
      <div className="border-b border-border px-4 py-3">
        <div className="text-sm font-medium">Timeline</div>
        <div className="text-xs text-muted-foreground">Tools, sub-agents, lifecycle</div>
      </div>
      <ScrollArea className="flex-1">
        <div className="space-y-2 p-3">
          {events.length === 0 ? (
            <div className="border border-dashed border-border px-3 py-8 text-center text-xs text-muted-foreground">
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
    <div className="border border-border bg-card px-3 py-2.5">
      <div className="flex items-start justify-between gap-3">
        <div className="text-sm font-medium leading-snug">{event.title}</div>
        <div className="shrink-0 font-mono text-[10px] text-muted-foreground">
          {formatRelativeTime(event.createdAt)}
        </div>
      </div>
      <div className={cn('mt-1 font-mono text-[10px] text-muted-foreground')}>
        {event.kind}
      </div>
      {event.detail ? (
        <pre className="mt-2 max-h-28 overflow-auto whitespace-pre-wrap border border-border bg-background p-2 font-mono text-[11px] text-muted-foreground">
          {event.detail}
        </pre>
      ) : null}
    </div>
  )
}
