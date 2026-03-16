"use client";

import { Badge } from "@/components/ui/shared";
import { useAuth } from "@/context/auth-context";
import { cn } from "@/lib/utils";
import {
    ClipboardList,
    FileText,
    GitBranch,
    LayoutDashboard,
    LogOut,
    MessageSquare,
    Newspaper,
    PiggyBank,
    Settings,
    Shield,
    TrendingUp,
    Wallet,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/salary", label: "Salary Slips", icon: FileText },
  { href: "/cashflow", label: "Cash Flow", icon: Wallet },
  { href: "/scenarios", label: "Scenarios", icon: GitBranch },
  { href: "/investments", label: "Investments", icon: PiggyBank },
  { href: "/assistant", label: "AI Assistant", icon: MessageSquare },
  { href: "/policies", label: "Policies", icon: Shield },
  { href: "/news", label: "News", icon: Newspaper },
  { href: "/audit", label: "Audit Trail", icon: ClipboardList },
  { href: "/settings", label: "Settings", icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();

  return (
    <aside className="flex h-screen w-64 flex-col border-r bg-card">
      {/* Header */}
      <div className="flex items-center gap-2 border-b px-6 py-4">
        <TrendingUp className="h-6 w-6 text-primary" />
        <span className="text-lg font-bold">FinPilot AI</span>
        <Badge className="ml-auto bg-green-100 text-green-700 border-green-300 text-[10px]">LOCAL</Badge>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-3 py-4">
        <ul className="space-y-1">
          {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
            const active = pathname === href || pathname.startsWith(href + "/");
            return (
              <li key={href}>
                <Link
                  href={href}
                  className={cn(
                    "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                    active
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Footer */}
      <div className="border-t px-4 py-3">
        {user && (
          <div className="mb-2 text-sm text-muted-foreground truncate">{user.name}</div>
        )}
        <button onClick={logout} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-destructive transition-colors">
          <LogOut className="h-4 w-4" />
          Logout
        </button>
      </div>
    </aside>
  );
}
