import { Link, useLocation } from "wouter";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import {
  LucideProps,
  LayoutDashboard,
  Plane,
  Users,
  UserRound,
  DoorOpen,
  Settings,
  LogOut,
  Menu,
  X,
  Loader2
} from "lucide-react";

interface NavItem {
  href: string;
  label: string;
  icon: React.ComponentType<LucideProps>;
  isActive?: boolean;
}

function SidebarLink({ href, label, icon: Icon, isActive }: NavItem) {
  return (
    <Link href={href}>
      <div
        className={cn(
          "flex items-center p-3 rounded-lg mb-1 transition-colors",
          isActive
            ? "bg-sidebar-accent text-sidebar-accent-foreground"
            : "text-sidebar-foreground/70 hover:bg-sidebar-accent/80 hover:text-sidebar-accent-foreground"
        )}
      >
        <Icon className="mr-3 h-5 w-5" />
        <span>{label}</span>
      </div>
    </Link>
  );
}

export function Sidebar() {
  const [location] = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const { logoutMutation } = useAuth();

  const navItems: NavItem[] = [
    {
      href: "/dashboard",
      label: "Dashboard",
      icon: LayoutDashboard,
      isActive: location === "/dashboard",
    },
    {
      href: "/flights",
      label: "Flights",
      icon: Plane,
      isActive: location === "/flights",
    },
    {
      href: "/passengers",
      label: "Passengers",
      icon: Users,
      isActive: location === "/passengers",
    },
    {
      href: "/employees",
      label: "Employees",
      icon: UserRound,
      isActive: location === "/employees",
    },
    {
      href: "/gates",
      label: "Gates",
      icon: DoorOpen,
      isActive: location === "/gates",
    },
    {
      href: "/settings",
      label: "Settings",
      icon: Settings,
      isActive: location === "/settings",
    },
  ];

  const toggleSidebar = () => {
    setMobileOpen(!mobileOpen);
  };

  return (
    <>
      {/* Mobile Menu Button */}
      <button
        onClick={toggleSidebar}
        className="md:hidden fixed top-4 left-4 z-30 bg-primary text-primary-foreground rounded-md p-2"
        aria-label={mobileOpen ? "Close Menu" : "Open Menu"}
      >
        {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </button>

      {/* Mobile Overlay */}
      {mobileOpen && (
        <div
          className="md:hidden fixed inset-0 z-20 bg-black/50"
          onClick={toggleSidebar}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "bg-sidebar text-sidebar-foreground w-64 flex-shrink-0 transition-all duration-300 ease-in-out fixed md:static inset-y-0 left-0 z-20 flex flex-col h-screen",
          mobileOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        )}
      >
        <div className="p-4 border-b border-sidebar-border">
          <h1 className="text-xl font-bold text-sidebar-foreground">Airport Management</h1>
        </div>

        <nav className="flex flex-col p-2 flex-1 overflow-y-auto">
          {navItems.map((item) => (
            <SidebarLink key={item.href} {...item} />
          ))}

          <div className="border-t border-sidebar-border my-4"></div>

          <div className="mt-auto">
            <Button
              variant="ghost"
              className="flex items-center w-full justify-start p-3 rounded-lg hover:bg-sidebar-accent/80 mb-1 text-sidebar-foreground/70 hover:text-sidebar-accent-foreground"
              onClick={() => logoutMutation.mutate()}
              disabled={logoutMutation.isPending}
            >
              {logoutMutation.isPending ? (
                <Loader2 className="mr-3 h-5 w-5 animate-spin" />
              ) : (
                <LogOut className="mr-3 h-5 w-5" />
              )}
              <span>{logoutMutation.isPending ? "Logging out..." : "Logout"}</span>
            </Button>
          </div>
        </nav>
      </aside>
    </>
  );
}
