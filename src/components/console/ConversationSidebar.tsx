import {
  LoaderCircle,
  MessageSquarePlus,
  Pin,
  Search,
  Trash2,
} from 'lucide-react'
import { useMemo, type ReactNode } from 'react'
import { OperatorIdentity } from '@/components/layout/OperatorIdentity'
import { QuotasStrip } from '@/components/layout/QuotasStrip'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import { useConversationsStore } from '@/stores/conversationsStore'
import type { Conversation } from '@/types/hermes'

function groupLabel(ts?: number): string {
  if (!ts) return 'OLDER'
  const date = new Date(ts * (ts < 1e12 ? 1000 : 1))
  const now = new Date()
  const startToday = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const startYesterday = new Date(startToday)
  startYesterday.setDate(startYesterday.getDate() - 1)
  const startWeek = new Date(startToday)
  startWeek.setDate(startWeek.getDate() - 7)
  if (date >= startToday) return 'TODAY'
  if (date >= startYesterday) return 'YESTERDAY'
  if (date >= startWeek) return 'THIS WEEK'
  return 'OLDER'
}

export function ConversationSidebar() {
  const conversations = useConversationsStore((state) => state.conversations)
  const activeId = useConversationsStore((state) => state.activeId)
  const filter = useConversationsStore((state) => state.filter)
  const loading = useConversationsStore((state) => state.loading)
  const setFilter = useConversationsStore((state) => state.setFilter)
  const select = useConversationsStore((state) => state.select)
  const togglePin = useConversationsStore((state) => state.togglePin)
  const remove = useConversationsStore((state) => state.remove)
  const clearActive = useConversationsStore((state) => state.clearActive)

  const filtered = useMemo(() => {
    const q = filter.trim().toLowerCase()
    if (!q) return conversations
    return conversations.filter((item) =>
      (item.title ?? item.id).toLowerCase().includes(q),
    )
  }, [conversations, filter])

  const pinned = filtered.filter((item) => item.pinned)
  const unpinned = filtered.filter((item) => !item.pinned)

  const groups = useMemo(() => {
    const map = new Map<string, Conversation[]>()
    for (const item of unpinned) {
      const label = groupLabel(item.updated_at ?? item.started_at)
      const list = map.get(label) ?? []
      list.push(item)
      map.set(label, list)
    }
    return map
  }, [unpinned])

  return (
    <aside className="flex w-[17.5rem] shrink-0 flex-col border-r border-border bg-sidebar">
      <div className="space-y-3 border-b border-border px-3 py-3">
        <div className="flex items-center gap-2">
          <div className="relative min-w-0 flex-1">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={filter}
              onChange={(event) => setFilter(event.target.value)}
              placeholder="Filter conversations…"
              className="h-8 rounded-full border-border/80 bg-secondary/40 pl-8 text-xs"
            />
          </div>
          <Button
            size="icon"
            variant="secondary"
            className="h-8 w-8 shrink-0 rounded-full"
            title="New chat"
            onClick={() => clearActive()}
          >
            <MessageSquarePlus className="h-4 w-4" />
          </Button>
        </div>
        {loading ? (
          <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
            <LoaderCircle className="h-3 w-3 animate-spin" />
            Loading…
          </div>
        ) : null}
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-2 py-2">
        {pinned.length > 0 ? (
          <Section title="PINNED">
            {pinned.map((item) => (
              <ConversationRow
                key={item.id}
                item={item}
                active={item.id === activeId}
                onSelect={() => void select(item.id)}
                onPin={() => void togglePin(item.id)}
                onDelete={() => void remove(item.id)}
              />
            ))}
          </Section>
        ) : null}

        {[...groups.entries()].map(([label, items]) => (
          <Section key={label} title={label}>
            {items.map((item) => (
              <ConversationRow
                key={item.id}
                item={item}
                active={item.id === activeId}
                onSelect={() => void select(item.id)}
                onPin={() => void togglePin(item.id)}
                onDelete={() => void remove(item.id)}
              />
            ))}
          </Section>
        ))}

        {filtered.length === 0 ? (
          <div className="px-2 py-8 text-left text-[11px] text-muted-foreground">
            No conversations yet
          </div>
        ) : null}
      </div>

      <QuotasStrip />
      <div className="border-t border-border">
        <OperatorIdentity />
      </div>
    </aside>
  )
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="mb-3">
      <div className="px-2 pb-1 text-left text-[10px] font-medium tracking-[0.14em] text-muted-foreground/80">
        {title}
      </div>
      <div className="space-y-0.5">{children}</div>
    </div>
  )
}

function ConversationRow({
  item,
  active,
  onSelect,
  onPin,
  onDelete,
}: {
  item: Conversation
  active: boolean
  onSelect: () => void
  onPin: () => void
  onDelete: () => void
}) {
  return (
    <div
      className={cn(
        'group flex w-full items-center gap-1 rounded-md px-2 py-1.5 transition-colors',
        active
          ? 'bg-foreground text-background'
          : 'text-muted-foreground hover:bg-accent hover:text-foreground',
      )}
    >
      <button
        type="button"
        onClick={onSelect}
        className="min-w-0 flex-1 truncate text-left text-xs leading-snug"
      >
        {item.title?.trim() || 'Untitled chat'}
      </button>
      <button
        type="button"
        title={item.pinned ? 'Unpin' : 'Pin'}
        onClick={onPin}
        className={cn(
          'rounded p-1 opacity-0 transition-opacity group-hover:opacity-100',
          active ? 'hover:bg-background/15' : 'hover:bg-foreground/10',
        )}
      >
        <Pin className={cn('h-3 w-3', item.pinned && 'fill-current')} />
      </button>
      <button
        type="button"
        title="Delete"
        onClick={onDelete}
        className={cn(
          'rounded p-1 opacity-0 transition-opacity group-hover:opacity-100',
          active ? 'hover:bg-background/15' : 'hover:bg-foreground/10',
        )}
      >
        <Trash2 className="h-3 w-3" />
      </button>
    </div>
  )
}
