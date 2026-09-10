import { MessageList } from '@/components/console/MessageList'
import { CommandInput } from '@/components/console/CommandInput'
import { ExecutionTimeline } from '@/components/timeline/ExecutionTimeline'
import { startRunWithStream } from '@/hooks/useRunStream'
import { useChatStore } from '@/stores/chatStore'
import { useConnectionStore } from '@/stores/connectionStore'
import { useTimelineStore } from '@/stores/timelineStore'
import { cn } from '@/lib/utils'

export function ChatConsole() {
  const messages = useChatStore((state) => state.messages)
  const isSending = useChatStore((state) => state.isSending)
  const hermes = useConnectionStore((state) => state.hermes)
  const collapsed = useTimelineStore((state) => state.collapsed)

  return (
    <div className="flex h-full min-h-0">
      <div className="flex min-w-0 flex-1 flex-col">
        <div className="min-h-0 flex-1">
          <MessageList messages={messages} />
        </div>
        <CommandInput
          disabled={isSending || hermes === 'offline'}
          onSubmit={startRunWithStream}
        />
      </div>
      <div
        className={cn(
          'shrink-0 overflow-hidden border-l border-border/80 transition-[width] duration-200',
          collapsed ? 'w-0 border-l-0' : 'w-[340px]',
        )}
      >
        {!collapsed ? <ExecutionTimeline /> : null}
      </div>
    </div>
  )
}
