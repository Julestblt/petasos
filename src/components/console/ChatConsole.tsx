import { ConversationSidebar } from '@/components/console/ConversationSidebar'
import { MessageList } from '@/components/console/MessageList'
import { CommandInput } from '@/components/console/CommandInput'
import { sendConversationMessage } from '@/hooks/useConversationStream'
import { useChatStore } from '@/stores/chatStore'
import { useConnectionStore } from '@/stores/connectionStore'
import { useConversationsStore } from '@/stores/conversationsStore'

export function ChatConsole() {
  const messages = useChatStore((state) => state.messages)
  const isSending = useChatStore((state) => state.isSending)
  const loadingMessages = useChatStore((state) => state.loadingMessages)
  const hermes = useConnectionStore((state) => state.hermes)
  const activeId = useConversationsStore((state) => state.activeId)
  const conversations = useConversationsStore((state) => state.conversations)
  const title =
    conversations.find((item) => item.id === activeId)?.title?.trim() ||
    (activeId ? 'Conversation' : 'New chat')

  return (
    <div className="flex h-full min-h-0">
      <ConversationSidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex h-12 items-center border-b border-border px-5">
          <div className="truncate text-sm text-muted-foreground">{title}</div>
        </div>
        <div className="min-h-0 flex-1">
          {loadingMessages ? (
            <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
              Loading messages…
            </div>
          ) : (
            <MessageList messages={messages} />
          )}
        </div>
        <CommandInput
          disabled={isSending || hermes === 'offline'}
          onSubmit={sendConversationMessage}
        />
      </div>
    </div>
  )
}
