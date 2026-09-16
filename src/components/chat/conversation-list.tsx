import { useMemo, type ReactNode } from 'react'
import {
  GitFork,
  LoaderCircle,
  MessageSquarePlus,
  MoreHorizontal,
  Pin,
  Trash2,
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { ConversationSearch } from '@/components/chat/conversation-search'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuAction,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarSeparator,
} from '@/components/ui/sidebar'
import { useConversationsStore } from '@/stores/conversationsStore'
import type { Conversation } from '@/types/hermes'

function groupLabel(ts?: number): string {
  if (!ts) return 'Older'
  const date = new Date(ts * (ts < 1e12 ? 1000 : 1))
  const now = new Date()
  const startToday = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const startYesterday = new Date(startToday)
  startYesterday.setDate(startYesterday.getDate() - 1)
  const startWeek = new Date(startToday)
  startWeek.setDate(startWeek.getDate() - 7)
  if (date >= startToday) return 'Today'
  if (date >= startYesterday) return 'Yesterday'
  if (date >= startWeek) return 'This week'
  return 'Older'
}

export function ConversationList() {
  const conversations = useConversationsStore((state) => state.conversations)
  const activeId = useConversationsStore((state) => state.activeId)
  const loading = useConversationsStore((state) => state.loading)
  const select = useConversationsStore((state) => state.select)
  const togglePin = useConversationsStore((state) => state.togglePin)
  const fork = useConversationsStore((state) => state.fork)
  const remove = useConversationsStore((state) => state.remove)
  const clearActive = useConversationsStore((state) => state.clearActive)
  const navigate = useNavigate()

  const pinned = conversations.filter((item) => item.pinned)
  const unpinned = conversations.filter((item) => !item.pinned)
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
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex shrink-0 items-center gap-1.5 px-3 py-2">
        <div className="min-w-0 flex-1">
          <ConversationSearch />
        </div>
        <Button
          size="icon"
          variant="ghost"
          className="size-8 shrink-0"
          title="New chat"
          onClick={() => {
            clearActive()
            navigate('/')
          }}
        >
          <MessageSquarePlus className="size-4" />
        </Button>
      </div>

      <SidebarSeparator className="mx-0 shrink-0" />

      {loading && conversations.length === 0 ? (
        <div className="flex shrink-0 items-center gap-2 px-4 py-3 text-xs text-muted-foreground">
          <LoaderCircle className="size-3 animate-spin" />
          Loading…
        </div>
      ) : null}

      <div className="min-h-0 flex-1 overflow-x-hidden overflow-y-auto overscroll-contain pb-2">
        {pinned.length > 0 ? (
          <Section title="Pinned">
            {pinned.map((item) => (
              <ConversationRow
                key={item.id}
                item={item}
                active={item.id === activeId}
                onSelect={() => {
                  void select(item.id)
                  navigate('/')
                }}
                onPin={() => void togglePin(item.id)}
                onFork={() => {
                  void fork(item.id).then(() => navigate('/'))
                }}
                onDelete={() => void remove(item.id)}
              />
            ))}
          </Section>
        ) : null}
        {[...groups.entries()].map(([label, items], index) => (
          <div key={label}>
            {(pinned.length > 0 || index > 0) && (
              <SidebarSeparator className="mx-3 my-1" />
            )}
            <Section title={label}>
              {items.map((item) => (
                <ConversationRow
                  key={item.id}
                  item={item}
                  active={item.id === activeId}
                  onSelect={() => {
                    void select(item.id)
                    navigate('/')
                  }}
                  onPin={() => void togglePin(item.id)}
                  onFork={() => {
                    void fork(item.id).then(() => navigate('/'))
                  }}
                  onDelete={() => void remove(item.id)}
                />
              ))}
            </Section>
          </div>
        ))}
        {conversations.length === 0 && !loading ? (
          <p className="px-4 py-6 text-xs text-muted-foreground">
            No conversations yet
          </p>
        ) : null}
      </div>
    </div>
  )
}

function Section({
  title,
  children,
}: {
  title: string
  children: ReactNode
}) {
  return (
    <SidebarGroup className="py-1">
      <SidebarGroupLabel>{title}</SidebarGroupLabel>
      <SidebarGroupContent>
        <SidebarMenu>{children}</SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  )
}

function ConversationRow({
  item,
  active,
  onSelect,
  onPin,
  onFork,
  onDelete,
}: {
  item: Conversation
  active: boolean
  onSelect: () => void
  onPin: () => void
  onFork: () => void
  onDelete: () => void
}) {
  return (
    <SidebarMenuItem>
      <SidebarMenuButton isActive={active} onClick={onSelect}>
        <span className="truncate">{item.title?.trim() || 'Untitled chat'}</span>
      </SidebarMenuButton>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <SidebarMenuAction showOnHover title="Conversation actions">
            <MoreHorizontal />
          </SidebarMenuAction>
        </DropdownMenuTrigger>
        <DropdownMenuContent side="right" align="start">
          <DropdownMenuItem onClick={onPin}>
            <Pin className={item.pinned ? 'fill-current' : undefined} />
            {item.pinned ? 'Unpin' : 'Pin'}
          </DropdownMenuItem>
          <DropdownMenuItem onClick={onFork}>
            <GitFork />
            Fork
          </DropdownMenuItem>
          <DropdownMenuItem variant="destructive" onClick={onDelete}>
            <Trash2 />
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </SidebarMenuItem>
  )
}
