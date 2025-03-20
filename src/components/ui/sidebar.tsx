
import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

// Context for sidebar state
interface SidebarContextProps {
  open: boolean;
  setOpen: React.Dispatch<React.SetStateAction<boolean>>;
  collapsible: "icon" | "none";
}

const SidebarContext = React.createContext<SidebarContextProps | undefined>(undefined);

export function useSidebar() {
  const context = React.useContext(SidebarContext);
  if (!context) {
    throw new Error("useSidebar must be used within a SidebarProvider");
  }
  return context;
}

// Sidebar Provider
interface SidebarProviderProps {
  children: React.ReactNode;
  defaultOpen?: boolean;
}

export function SidebarProvider({
  children,
  defaultOpen = true,
}: SidebarProviderProps) {
  const [open, setOpen] = React.useState(defaultOpen);
  const [collapsible, setCollapsible] = React.useState<"icon" | "none">("icon");

  return (
    <SidebarContext.Provider value={{ open, setOpen, collapsible }}>
      {children}
    </SidebarContext.Provider>
  );
}

// Sidebar component
const sidebarVariants = cva(
  "h-full flex flex-col border-r bg-sidebar-background text-sidebar-foreground transition-all duration-300 ease-in-out",
  {
    variants: {
      variant: {
        default: "w-64",
        sidebar: "w-64",
        minimal: "w-16",
      },
      open: {
        true: "",
        false: "w-16",
      },
    },
    defaultVariants: {
      variant: "default",
      open: true,
    },
  }
);

interface SidebarProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof sidebarVariants> {
  collapsible?: "icon" | "none";
}

export function Sidebar({
  className,
  variant,
  open,
  collapsible = "icon",
  ...props
}: SidebarProps) {
  const context = useSidebar();
  const isOpen = open !== undefined ? open : context?.open;

  return (
    <div
      className={cn(
        sidebarVariants({ variant, open: isOpen }),
        className
      )}
      {...props}
    />
  );
}

// Sidebar Trigger
interface SidebarTriggerProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {}

export function SidebarTrigger({ className, ...props }: SidebarTriggerProps) {
  const { open, setOpen } = useSidebar();

  return (
    <button
      className={cn(
        "flex h-9 w-9 items-center justify-center rounded-md border bg-sidebar-background text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
        className
      )}
      onClick={() => setOpen(!open)}
      {...props}
    >
      {open ? (
        <ChevronLeft className="h-4 w-4" />
      ) : (
        <ChevronRight className="h-4 w-4" />
      )}
    </button>
  );
}

// Sidebar Header
interface SidebarHeaderProps extends React.HTMLAttributes<HTMLDivElement> {}

export function SidebarHeader({ className, ...props }: SidebarHeaderProps) {
  return (
    <div
      className={cn("flex h-14 items-center border-b px-4", className)}
      {...props}
    />
  );
}

// Sidebar Content
interface SidebarContentProps extends React.HTMLAttributes<HTMLDivElement> {}

export function SidebarContent({ className, ...props }: SidebarContentProps) {
  return <div className={cn("flex-1 overflow-auto", className)} {...props} />;
}

// Sidebar Footer
interface SidebarFooterProps extends React.HTMLAttributes<HTMLDivElement> {}

export function SidebarFooter({ className, ...props }: SidebarFooterProps) {
  return (
    <div
      className={cn("flex items-center border-t p-4", className)}
      {...props}
    />
  );
}

// Sidebar Menu
interface SidebarMenuProps extends React.HTMLAttributes<HTMLDivElement> {}

export function SidebarMenu({ className, ...props }: SidebarMenuProps) {
  return <div className={cn("px-2 py-2", className)} {...props} />;
}

// Sidebar Menu Item
interface SidebarMenuItemProps extends React.HTMLAttributes<HTMLDivElement> {}

export function SidebarMenuItem({ className, ...props }: SidebarMenuItemProps) {
  return <div className={cn("mb-1", className)} {...props} />;
}

// Sidebar Menu Button
interface SidebarMenuButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  isActive?: boolean;
  tooltip?: string;
}

export function SidebarMenuButton({
  className,
  isActive,
  tooltip,
  children,
  ...props
}: SidebarMenuButtonProps) {
  const { open } = useSidebar();

  const button = (
    <button
      className={cn(
        "flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors",
        isActive
          ? "bg-sidebar-primary text-sidebar-primary-foreground"
          : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
        className
      )}
      {...props}
    >
      {children}
    </button>
  );

  if (!open && tooltip) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>{button}</TooltipTrigger>
          <TooltipContent side="right">{tooltip}</TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return button;
}
