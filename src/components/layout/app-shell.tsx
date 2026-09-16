import type { CSSProperties } from 'react'
import { AppSidebar } from '@/components/layout/app-sidebar'
import { SidebarInset, SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar'
import { Separator } from '@/components/ui/separator'
import { useChatStore } from '@/stores/chatStore'
import { useConversationsStore } from '@/stores/conversationsStore'
import { Outlet, useLocation } from 'react-router-dom'

function pageTitle(pathname: string, conversationTitle: string): string {
  if (pathname.startsWith('/status')) return 'Status'
  if (pathname.startsWith('/skills')) return 'Skills'
  return conversationTitle
}

export function AppShell() {
  const location = useLocation()
  const activeId = useConversationsStore((state) => state.activeId)
  const conversations = useConversationsStore((state) => state.conversations)
  const isSending = useChatStore((state) => state.isSending)
  const title =
    conversations.find((item) => item.id === activeId)?.title?.trim() ||
    (activeId ? 'Conversation' : 'New chat')

  return (
    <SidebarProvider
      className="h-svh overflow-hidden"
      style={{ '--sidebar-width': '18rem' } as CSSProperties}
    >
      <AppSidebar />
      <SidebarInset className="min-h-0 overflow-hidden bg-background">
        <header className="flex h-12 shrink-0 items-center gap-2 border-b px-3">
          <SidebarTrigger className="-ml-0.5" />
          <Separator orientation="vertical" className="h-4" />
          <div className="min-w-0 flex-1 truncate text-sm">{pageTitle(location.pathname, title)}</div>
          {isSending ? (
            <span className="text-[11px] text-muted-foreground">Hermes is working…</span>
          ) : null}
        </header>
        <div className="min-h-0 flex-1 overflow-hidden">
          <Outlet />
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
