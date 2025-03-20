
import { useState } from "react";
import { 
  BarChart3, 
  Calendar, 
  Code2, 
  Database, 
  FileText, 
  Home, 
  LayoutDashboard, 
  LifeBuoy, 
  Play, 
  Plus, 
  Settings, 
  Timer
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  SidebarProvider,
  Sidebar,
  SidebarTrigger,
  SidebarContent,
  SidebarHeader,
  SidebarFooter,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from "@/components/ui/sidebar";

const SidebarNav = () => {
  const [activeItem, setActiveItem] = useState("dashboard");

  return (
    <SidebarProvider defaultOpen={true}>
      <Sidebar variant="sidebar" collapsible="icon">
        <SidebarHeader>
          <div className="flex items-center justify-between">
            <SidebarTrigger />
            <Button variant="primary" size="sm" className="gap-1 w-full">
              <Plus className="h-4 w-4" />
              <span>New Workflow</span>
            </Button>
          </div>
        </SidebarHeader>
        <SidebarContent>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton 
                isActive={activeItem === "dashboard"}
                onClick={() => setActiveItem("dashboard")}
                tooltip="Dashboard"
              >
                <Home className="h-4 w-4" />
                <span>Dashboard</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton 
                isActive={activeItem === "workflows"}
                onClick={() => setActiveItem("workflows")}
                tooltip="Workflows"
              >
                <LayoutDashboard className="h-4 w-4" />
                <span>Workflows</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton 
                isActive={activeItem === "runs"}
                onClick={() => setActiveItem("runs")}
                tooltip="Runs"
              >
                <Play className="h-4 w-4" />
                <span>Runs</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton 
                isActive={activeItem === "schedules"}
                onClick={() => setActiveItem("schedules")}
                tooltip="Schedules"
              >
                <Calendar className="h-4 w-4" />
                <span>Schedules</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton 
                isActive={activeItem === "monitoring"}
                onClick={() => setActiveItem("monitoring")}
                tooltip="Monitoring"
              >
                <BarChart3 className="h-4 w-4" />
                <span>Monitoring</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton 
                isActive={activeItem === "logs"}
                onClick={() => setActiveItem("logs")}
                tooltip="Logs"
              >
                <FileText className="h-4 w-4" />
                <span>Logs</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton 
                isActive={activeItem === "resources"}
                onClick={() => setActiveItem("resources")}
                tooltip="Resources"
              >
                <Database className="h-4 w-4" />
                <span>Resources</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton 
                isActive={activeItem === "triggers"}
                onClick={() => setActiveItem("triggers")}
                tooltip="Triggers"
              >
                <Timer className="h-4 w-4" />
                <span>Triggers</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton 
                isActive={activeItem === "code"}
                onClick={() => setActiveItem("code")}
                tooltip="Code"
              >
                <Code2 className="h-4 w-4" />
                <span>Code</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarContent>
        <SidebarFooter>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton 
                isActive={activeItem === "settings"}
                onClick={() => setActiveItem("settings")}
                tooltip="Settings"
              >
                <Settings className="h-4 w-4" />
                <span>Settings</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton 
                isActive={activeItem === "help"}
                onClick={() => setActiveItem("help")}
                tooltip="Help"
              >
                <LifeBuoy className="h-4 w-4" />
                <span>Help</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarFooter>
      </Sidebar>
    </SidebarProvider>
  );
};

export default SidebarNav;
