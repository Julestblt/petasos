import { BookOpen, Radio, type LucideIcon } from 'lucide-react'
import { NavLink, useLocation } from 'react-router-dom'
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar'

export interface SidebarNavItem {
  to: string
  label: string
  icon: LucideIcon
  end?: boolean
}

export const SIDEBAR_NAV: SidebarNavItem[] = [
  { to: '/status', label: 'Status', icon: Radio },
  { to: '/skills', label: 'Skills', icon: BookOpen },
]

export function SidebarNav({ items = SIDEBAR_NAV }: { items?: SidebarNavItem[] }) {
  const location = useLocation()

  return (
    <SidebarGroup className="px-2 py-1 group-data-[collapsible=icon]:px-1">
      <SidebarGroupContent>
        <SidebarMenu>
          {items.map((item) => {
            const Icon = item.icon
            const active = item.end
              ? location.pathname === item.to
              : location.pathname === item.to ||
                location.pathname.startsWith(`${item.to}/`)
            return (
              <SidebarMenuItem key={item.to}>
                <SidebarMenuButton
                  asChild
                  isActive={active}
                  tooltip={item.label}
                >
                  <NavLink to={item.to}>
                    <Icon />
                    <span>{item.label}</span>
                  </NavLink>
                </SidebarMenuButton>
              </SidebarMenuItem>
            )
          })}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  )
}
