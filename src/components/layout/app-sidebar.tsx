import { BrandMark } from "@/components/brand/brand-mark";
import { ConversationList } from "@/components/chat/conversation-list";
import { OperatorCard } from "@/components/layout/operator-card";
import { SidebarNav } from "@/components/layout/sidebar-nav";
import { SidebarTelemetry } from "@/components/layout/sidebar-telemetry";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
  SidebarSeparator,
} from "@/components/ui/sidebar";
import { Link } from "react-router-dom";

export function AppSidebar() {
  return (
    <Sidebar collapsible="none">
      <SidebarHeader className="gap-3 px-3 pt-4 pb-2 group-data-[collapsible=icon]:px-2 group-data-[collapsible=icon]:pt-3">
        <div className="flex items-center gap-3 group-data-[collapsible=icon]:flex-col group-data-[collapsible=icon]:gap-2">
          <Link to="/" className="flex items-center gap-3">
            <BrandMark
              size={36}
              className="shrink-0 group-data-[collapsible=icon]:size-7!"
            />
            <span className="min-w-0 flex-1 truncate font-display text-xl leading-none group-data-[collapsible=icon]:hidden">
              Petasos
            </span>
          </Link>
        </div>
      </SidebarHeader>

      <SidebarNav />

      <SidebarSeparator className="mx-0 group-data-[collapsible=icon]:hidden" />

      <SidebarContent className="min-h-0 flex-1 gap-0 overflow-hidden px-0 group-data-[collapsible=icon]:pointer-events-none group-data-[collapsible=icon]:opacity-0">
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
  );
}
