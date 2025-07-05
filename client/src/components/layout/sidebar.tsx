import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Users,
  Bot,
  PhoneCall,
  Target,
  GitBranch,
  Settings,
  BarChart3,
  Shield,
  CreditCard,
  Phone,
  User,
  MoreHorizontal,
} from "lucide-react";

const navigation = [
  { name: "Dashboard", href: "/", icon: LayoutDashboard },
  { name: "Tenant Management", href: "/tenant-management", icon: Users },
  { name: "AI Agent Training", href: "/ai-training", icon: Bot },
  { name: "Call Management", href: "/call-management", icon: PhoneCall },
  { name: "Campaign Management", href: "/campaign-management", icon: Target },
  { name: "Flow Builder", href: "/flow-builder", icon: GitBranch },
  { name: "Providers", href: "/providers", icon: Settings },
];

const systemNavigation = [
  { name: "Analytics", href: "/analytics", icon: BarChart3 },
  { name: "Security", href: "/security", icon: Shield },
  { name: "Billing", href: "/billing", icon: CreditCard },
];

export function Sidebar() {
  const [location] = useLocation();

  return (
    <div className="w-64 bg-card border-r border-border flex flex-col">
      {/* Logo */}
      <div className="p-6 border-b border-border">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
            <Phone className="w-5 h-5 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-lg font-semibold text-foreground">VoiceAI Hub</h1>
            <p className="text-xs text-muted-foreground">Enterprise Edition</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 py-6 space-y-2">
        <div className="space-y-1">
          {navigation.map((item) => {
            const isActive = location === item.href;
            return (
              <Link key={item.name} href={item.href}>
                <button
                  className={cn(
                    "sidebar-nav-item",
                    isActive && "active"
                  )}
                >
                  <item.icon className="w-4 h-4" />
                  <span>{item.name}</span>
                </button>
              </Link>
            );
          })}
        </div>

        <div className="pt-6 mt-6 border-t border-border">
          <p className="px-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">
            System
          </p>
          <div className="mt-2 space-y-1">
            {systemNavigation.map((item) => {
              const isActive = location === item.href;
              return (
                <Link key={item.name} href={item.href}>
                  <button
                    className={cn(
                      "sidebar-nav-item",
                      isActive && "active"
                    )}
                  >
                    <item.icon className="w-4 h-4" />
                    <span>{item.name}</span>
                  </button>
                </Link>
              );
            })}
          </div>
        </div>
      </nav>

      {/* User Profile */}
      <div className="p-4 border-t border-border">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-muted rounded-full flex items-center justify-center">
            <User className="w-4 h-4 text-muted-foreground" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-foreground truncate">Admin User</p>
            <p className="text-xs text-muted-foreground truncate">Root Administrator</p>
          </div>
          <button className="text-muted-foreground hover:text-foreground">
            <MoreHorizontal className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
