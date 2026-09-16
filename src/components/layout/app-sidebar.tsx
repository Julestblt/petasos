import { ConversationList } from '@/components/chat/conversation-list'
import { BrandMark } from '@/components/brand/brand-mark'
import { OperatorCard } from '@/components/layout/operator-card'
import { SidebarTelemetry } from '@/components/layout/sidebar-telemetry'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
  SidebarSeparator,
  SidebarTrigger,
  useSidebar,
} from '@/components/ui/sidebar'
import { PanelLeft, PanelLeftClose } from 'lucide-react'

export function AppSidebar() {
  const collapsed = useSidebar().state === 'collapsed'

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="gap-2 px-3 pt-3 group-data-[collapsible=icon]:px-2">
        <div className="flex items-center gap-2 group-data-[collapsible=icon]:flex-col group-data-[collapsible=icon]:gap-2">
          <BrandMark size={18} className="shrink-0" />
          <span className="min-w-0 flex-1 truncate font-display text-sm tracking-tight group-data-[collapsible=icon]:hidden">
            Petasos
          </span>
          <SidebarTrigger className="size-7 text-muted-foreground hover:text-foreground">
            {collapsed ? (
              <PanelLeft className="size-4" />
            ) : (
              <PanelLeftClose className="size-4" />
            )}
          </SidebarTrigger>
        </div>
      </SidebarHeader>

      <SidebarSeparator className="mx-0 group-data-[collapsible=icon]:hidden" />

      <SidebarContent className="min-h-0 flex-1 overflow-hidden px-0 pt-2 group-data-[collapsible=icon]:pointer-events-none group-data-[collapsible=icon]:opacity-0">
        <ConversationList />
      </SidebarContent>

      <SidebarSeparator className="mx-0 group-data-[collapsible=icon]:hidden" />

      <SidebarFooter className="mt-auto gap-3 p-3 group-data-[collapsible=icon]:items-center group-data-[collapsible=icon]:p-2">
        <div className="group-data-[collapsible=icon]:hidden">
          <SidebarTelemetry />
          <SidebarSeparator className="mx-0 my-3" />
        </div>
        <OperatorCard />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
