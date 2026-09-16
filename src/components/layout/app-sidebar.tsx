import { ConversationList } from '@/components/chat/conversation-list'
import { BrandMark } from '@/components/brand/brand-mark'
import { OperatorCard } from '@/components/layout/operator-card'
import { SidebarTelemetry } from '@/components/layout/sidebar-telemetry'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  SidebarSeparator,
} from '@/components/ui/sidebar'
import { Activity, BookOpen, MessageSquare } from 'lucide-react'
import { NavLink, useLocation } from 'react-router-dom'

const NAV = [
  { to: '/', label: 'Chat', icon: MessageSquare, end: true },
  { to: '/status', label: 'Status', icon: Activity, end: false },
  { to: '/skills', label: 'Skills', icon: BookOpen, end: false },
] as const

export function AppSidebar() {
  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="px-2 pt-3">
        <div className="flex items-center gap-2.5 px-1 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-0">
          <BrandMark size={20} className="shrink-0" />
          <span className="font-display text-sm tracking-tight group-data-[collapsible=icon]:hidden">
            Petasos
          </span>
        </div>
      </SidebarHeader>

      <SidebarContent className="gap-0 overflow-hidden">
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {NAV.map((item) => (
                <NavItem key={item.to} item={item} />
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarSeparator className="mx-0 group-data-[collapsible=icon]:hidden" />

        <div className="min-h-0 flex-1 overflow-hidden group-data-[collapsible=icon]:hidden">
          <ConversationList />
        </div>
      </SidebarContent>

      <SidebarFooter className="gap-3 p-3 group-data-[collapsible=icon]:p-2">
        <div className="group-data-[collapsible=icon]:hidden">
          <SidebarTelemetry />
        </div>
        <SidebarSeparator className="mx-0 group-data-[collapsible=icon]:hidden" />
        <OperatorCard />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}

function NavItem({ item }: { item: (typeof NAV)[number] }) {
  const location = useLocation()
  const active = item.end
    ? location.pathname === item.to || location.pathname === ''
    : location.pathname.startsWith(item.to)

  return (
    <SidebarMenuItem>
      <SidebarMenuButton asChild isActive={active} tooltip={item.label}>
        <NavLink to={item.to} end={item.end}>
          <item.icon />
          <span>{item.label}</span>
        </NavLink>
      </SidebarMenuButton>
    </SidebarMenuItem>
  )
}
