import { useEffect, useMemo, useState } from 'react'
import { MessageSquare, MessageSquarePlus, Pin, Search } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from '@/components/ui/command'
import { useConversationsStore } from '@/stores/conversationsStore'
import type { Conversation } from '@/types/hermes'

function isModK(event: KeyboardEvent): boolean {
  return (
    (event.metaKey || event.ctrlKey) &&
    !event.altKey &&
    event.key.toLowerCase() === 'k'
  )
}

function titleOf(item: Conversation): string {
  return item.title?.trim() || 'Untitled chat'
}

export function ConversationSearch() {
  const [open, setOpen] = useState(false)
  const conversations = useConversationsStore((state) => state.conversations)
  const select = useConversationsStore((state) => state.select)
  const clearActive = useConversationsStore((state) => state.clearActive)
  const navigate = useNavigate()

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (!isModK(event)) return
      event.preventDefault()
      setOpen((value) => !value)
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [])

  const pinned = useMemo(
    () => conversations.filter((item) => item.pinned),
    [conversations],
  )
  const recent = useMemo(
    () => conversations.filter((item) => !item.pinned).slice(0, 24),
    [conversations],
  )

  function openChat(id: string) {
    setOpen(false)
    void select(id)
    navigate('/')
  }

  function startNew() {
    setOpen(false)
    clearActive()
    navigate('/')
  }

  const modLabel =
    typeof navigator !== 'undefined' && /Mac|iPhone|iPad|iPod/i.test(navigator.userAgent)
      ? '⌘'
      : 'Ctrl'

  return (
    <>
      <Button
        type="button"
        variant="outline"
        className="h-8 w-full justify-start gap-2 bg-transparent px-2.5 text-xs font-normal text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
        onClick={() => setOpen(true)}
      >
        <Search className="size-3.5 shrink-0 opacity-70" />
        <span className="min-w-0 flex-1 truncate text-left">Search chats…</span>
        <kbd className="pointer-events-none hidden h-5 items-center gap-0.5 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground sm:inline-flex">
          <span className="text-[11px]">{modLabel}</span>K
        </kbd>
      </Button>

      <CommandDialog open={open} onOpenChange={setOpen} title="Search chats">
        <CommandInput placeholder="Search chats…" />
        <CommandList>
          <CommandEmpty>No chats found.</CommandEmpty>
          <CommandGroup heading="Actions">
            <CommandItem value="new-chat" onSelect={startNew}>
              <MessageSquarePlus />
              New chat
            </CommandItem>
          </CommandGroup>
          {pinned.length > 0 ? (
            <>
              <CommandSeparator />
              <CommandGroup heading="Pinned">
                {pinned.map((item) => (
                  <CommandItem
                    key={item.id}
                    value={`${titleOf(item)} ${item.id} pinned`}
                    onSelect={() => openChat(item.id)}
                  >
                    <Pin className="fill-current" />
                    <span className="truncate">{titleOf(item)}</span>
                  </CommandItem>
                ))}
              </CommandGroup>
            </>
          ) : null}
          {recent.length > 0 ? (
            <>
              <CommandSeparator />
              <CommandGroup heading="Recent">
                {recent.map((item) => (
                  <CommandItem
                    key={item.id}
                    value={`${titleOf(item)} ${item.id}`}
                    onSelect={() => openChat(item.id)}
                  >
                    <MessageSquare />
                    <span className="truncate">{titleOf(item)}</span>
                  </CommandItem>
                ))}
              </CommandGroup>
            </>
          ) : null}
        </CommandList>
      </CommandDialog>
    </>
  )
}
