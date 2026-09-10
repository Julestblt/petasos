import ReactMarkdown from 'react-markdown'
import rehypeHighlight from 'rehype-highlight'
import remarkGfm from 'remark-gfm'
import { ScrollArea } from '@/components/ui/scroll-area'
import { cn } from '@/lib/utils'
import type { ChatMessage } from '@/types/hermes'

export function MessageList({ messages }: { messages: ChatMessage[] }) {
  return (
    <ScrollArea className="h-full">
      <div className="mx-auto flex max-w-3xl flex-col gap-4 px-5 py-6">
        {messages.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border/80 px-6 py-16 text-center">
            <div className="font-display text-2xl tracking-tight">Console</div>
            <p className="mt-2 text-sm text-muted-foreground">
              Send a command to Hermes. Tool calls and lifecycle events appear in
              the execution timeline.
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

  return (
    <div className={cn('flex', isUser ? 'justify-end' : 'justify-start')}>
      <div
        className={cn(
          'max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed',
          isUser
            ? 'bg-primary text-primary-foreground'
            : 'border border-border/80 bg-card/80 text-foreground',
        )}
      >
        <div className="mb-1 text-[11px] uppercase tracking-[0.16em] opacity-70">
          {message.role}
          {message.streaming ? ' · streaming' : ''}
        </div>
        {isUser ? (
          <div className="whitespace-pre-wrap">{message.content}</div>
        ) : (
          <div className="prose prose-invert prose-sm max-w-none prose-pre:bg-zinc-950 prose-pre:border prose-pre:border-border">
            <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeHighlight]}>
              {message.content || (message.streaming ? '…' : '')}
            </ReactMarkdown>
          </div>
        )}
      </div>
    </div>
  )
}
