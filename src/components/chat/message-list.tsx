import { useEffect, useRef } from 'react'
import ReactMarkdown from 'react-markdown'
import rehypeHighlight from 'rehype-highlight'
import remarkGfm from 'remark-gfm'
import { ActionStream } from '@/components/chat/action-stream'
import { ScrollArea } from '@/components/ui/scroll-area'
import { cn } from '@/lib/utils'
import type { ChatMessage } from '@/types/hermes'

export function MessageList({ messages }: { messages: ChatMessage[] }) {
  const endRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' })
  }, [messages])

  return (
    <ScrollArea className="h-full">
      <div className="mx-auto flex max-w-3xl flex-col gap-6 px-5 py-8">
        {messages.length === 0 ? (
          <EmptyState />
        ) : (
          messages.map((message) => (
            <MessageBubble key={message.id} message={message} />
          ))
        )}
        <div ref={endRef} />
      </div>
    </ScrollArea>
  )
}

function EmptyState() {
  return (
    <div className="flex min-h-[50vh] flex-col justify-center px-1">
      <p className="font-display text-2xl tracking-tight">Ask Hermes</p>
      <p className="mt-2 max-w-md text-sm text-muted-foreground">
        Inspect the homelab, run commands, or pick up a previous conversation
        from the sidebar.
      </p>
    </div>
  )
}

function MessageBubble({ message }: { message: ChatMessage }) {
  const isUser = message.role === 'user'
  const hasThinking = Boolean(message.thinking && message.thinking.length > 0)
  const hasContent = Boolean(message.content.trim())

  if (isUser) {
    return (
      <div className="flex justify-end">
        <div className="max-w-[85%] rounded-2xl bg-primary px-4 py-3 text-sm leading-relaxed text-primary-foreground">
          <div className="whitespace-pre-wrap">{message.content}</div>
        </div>
      </div>
    )
  }

  if (!hasContent && !hasThinking && !message.streaming) {
    return null
  }

  return (
    <div className="min-w-0">
      {hasThinking ? (
        <ActionStream
          items={message.thinking ?? []}
          active={Boolean(message.streaming)}
        />
      ) : null}
      {hasContent || message.streaming ? (
        <div
          className={cn(
            'prose prose-sm dark:prose-invert max-w-none text-sm leading-relaxed',
            'prose-pre:rounded-xl prose-pre:border prose-pre:border-border prose-pre:bg-muted/50',
          )}
        >
          <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeHighlight]}>
            {message.content || (message.streaming ? '…' : '')}
          </ReactMarkdown>
          {message.streaming ? (
            <span className="ml-0.5 inline-block h-3.5 w-1.5 translate-y-0.5 animate-pulse bg-foreground" />
          ) : null}
        </div>
      ) : null}
    </div>
  )
}
