import { Composer } from '@/components/chat/composer'
import { MessageList } from '@/components/chat/message-list'
import { Skeleton } from '@/components/ui/skeleton'
import { sendConversationMessage } from '@/hooks/useConversationStream'
import { useChatStore } from '@/stores/chatStore'
import { useConnectionStore } from '@/stores/connectionStore'

export function ChatPage() {
  const messages = useChatStore((state) => state.messages)
  const isSending = useChatStore((state) => state.isSending)
  const loadingMessages = useChatStore((state) => state.loadingMessages)
  const hermes = useConnectionStore((state) => state.hermes)

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="min-h-0 flex-1">
        {loadingMessages ? (
          <div className="mx-auto flex max-w-3xl flex-col gap-4 px-5 py-8">
            <Skeleton className="h-16 w-2/3 self-end" />
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-12 w-1/2 self-end" />
          </div>
        ) : (
          <MessageList messages={messages} />
        )}
      </div>
      <Composer
        disabled={isSending || hermes === 'offline'}
        onSubmit={sendConversationMessage}
      />
    </div>
  )
}
