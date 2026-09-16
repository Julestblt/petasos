import ReactMarkdown from 'react-markdown'
import rehypeHighlight from 'rehype-highlight'
import remarkGfm from 'remark-gfm'
import { ThinkingPanel } from '@/components/console/ThinkingPanel'
import { ScrollArea } from '@/components/ui/scroll-area'
import { cn } from '@/lib/utils'
import type { ChatMessage } from '@/types/hermes'

export function MessageList({ messages }: { messages: ChatMessage[] }) {
  return (
    <ScrollArea className="h-full">
      <div className="mx-auto flex max-w-3xl flex-col gap-6 px-5 py-6">
        {messages.length === 0 ? (
          <div className="px-6 py-20 text-center">
            <div className="font-display text-3xl tracking-[-0.04em]">Hermes</div>
            <p className="mt-2 text-sm text-muted-foreground">
              Ask Hermes to inspect, edit, or run something on the homelab.
            </p>
          </div>
        ) : (
          messages.map((message) => (
            <MessageBubble key={message.id} message={message} />
          ))
        )}
      </div>
    </ScrollArea>
  )
}

function MessageBubble({ message }: { message: ChatMessage }) {
  const isUser = message.role === 'user'
  const hasThinking = Boolean(message.thinking && message.thinking.length > 0)
  const hasContent = Boolean(message.content.trim())

  if (isUser) {
    return (
      <div className="flex justify-end">
        <div className="max-w-[85%] rounded-2xl bg-foreground px-4 py-3 text-sm leading-relaxed text-background">
          <div className="whitespace-pre-wrap">{message.content}</div>
        </div>
      </div>
    )
  }

  if (!hasContent && !hasThinking && !message.streaming) {
    return null
  }

  return (
    <div className="flex justify-start gap-3">
      <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-secondary text-[11px] font-semibold tracking-tight text-foreground">
        H
      </div>
      <div className="min-w-0 max-w-[85%] flex-1">
        <div className="mb-1 flex items-center gap-2 text-[11px] text-muted-foreground">
          <span className="font-medium text-foreground">Hermes</span>
          {message.streaming ? <span>streaming</span> : null}
        </div>
        {hasThinking ? (
          <ThinkingPanel
            items={message.thinking ?? []}
            active={Boolean(message.streaming)}
          />
        ) : null}
        {hasContent || message.streaming ? (
          <div
            className={cn(
              'prose prose-invert prose-sm max-w-none text-sm leading-relaxed',
              'prose-pre:rounded-xl prose-pre:border prose-pre:border-border prose-pre:bg-zinc-950',
            )}
          >
            <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeHighlight]}>
              {message.content || (message.streaming ? '…' : '')}
            </ReactMarkdown>
          </div>
        ) : null}
      </div>
    </div>
  )
}
