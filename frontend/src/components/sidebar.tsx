"use client";

import { Badge } from "@/components/ui/shared";
import { useAuth } from "@/context/auth-context";
import { useReadiness } from "@/context/readiness-context";
import { cn } from "@/lib/utils";
import {
    ChevronRight,
    ClipboardList,
    Download,
    FileText,
    GitBranch,
    Info,
    LayoutDashboard,
    Leaf,
    Lock,
    LogOut,
    MessageSquare,
    Moon,
    Newspaper,
    PiggyBank,
    Settings,
    Shield,
    SunMedium,
    Wallet
} from "lucide-react";
import { useTheme } from "next-themes";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard, guided: false },
  { href: "/salary", label: "Salary Slips", icon: FileText, guided: true },
  { href: "/cashflow", label: "Cash Flow", icon: Wallet, guided: true },
  { href: "/scenarios", label: "Scenarios", icon: GitBranch, guided: true },
  { href: "/investments", label: "Investments", icon: PiggyBank, guided: true },
  { href: "/assistant", label: "AI Assistant", icon: MessageSquare, guided: false },
  { href: "/policies", label: "Policies", icon: Shield, guided: false },
  { href: "/news", label: "News", icon: Newspaper, guided: false },
  { href: "/audit", label: "Audit Trail", icon: ClipboardList, guided: false },
  { href: "/settings", label: "Settings", icon: Settings, guided: false },
] as const;

const POPOVER_COPY = {
  "/salary": {
    title: "Salary Slips",
    what: "Uploaded payslips, extracted income breakdown, verification.",
    unlock: "Upload and verify at least one salary slip to power forecasts and recommendations.",
    cta: "Go to Income Setup",
  },
  "/cashflow": {
    title: "Cashflow",
    what: "Expense baseline, goals, and 3/6/12 month forecasts with risk months.",
    unlock: "Add income and monthly expenses.",
    cta: "Go to Setup Checklist",
  },
  "/scenarios": {
    title: "Scenarios",
    what: "What-if comparisons and their impact on risk months and goals.",
    unlock: "Generate a 6-month forecast first.",
    cta: "Generate Forecast",
  },
  "/investments": {
    title: "Investments",
    what: "Safe-to-invest estimate and bucket allocation plan with evidence and audit trail.",
    unlock: "Add income and expenses, then generate a forecast.",
    cta: "Generate Plan",
  },
} as const;

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuth();
  const { loading, flags, lockedRoutes } = useReadiness();
  const { resolvedTheme, setTheme } = useTheme();
  const [openPopover, setOpenPopover] = useState<string | null>(null);
  const popoverBtnRefs = useRef<Record<string, HTMLButtonElement | null>>({});
  const [popoverPos, setPopoverPos] = useState<{ top: number; left: number } | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  const openSetupPopover = useCallback((href: string) => {
    if (openPopover === href) {
      setOpenPopover(null);
      setPopoverPos(null);
      return;
    }
    const btn = popoverBtnRefs.current[href];
    if (btn) {
      const rect = btn.getBoundingClientRect();
      setPopoverPos({ top: rect.top, left: rect.right + 8 });
    }
    setOpenPopover(href);
  }, [openPopover]);

  const routeState = useMemo(
    () => ({
      "/salary": { locked: false, ready: flags.incomeExists },
      "/cashflow": { locked: lockedRoutes["/cashflow"], ready: !lockedRoutes["/cashflow"] },
      "/scenarios": { locked: lockedRoutes["/scenarios"], ready: !lockedRoutes["/scenarios"] },
      "/investments": { locked: lockedRoutes["/investments"], ready: !lockedRoutes["/investments"] },
    }),
    [flags.incomeExists, lockedRoutes]
  );


  return (
    <>
    <aside className="hidden w-[260px] shrink-0 sticky top-0 h-screen border-r border-[hsl(var(--sidebar-border))] bg-[hsl(var(--sidebar))] text-[hsl(var(--sidebar-foreground))] lg:flex lg:flex-col overflow-hidden">
      <div className="border-b border-[hsl(var(--sidebar-border))] px-5 py-4">
        <div className="flex items-center gap-2.5">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/15 text-primary">
            <Leaf className="h-5 w-5" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-base font-semibold truncate">FinPilot AI</p>
            <p className="text-[10px] text-muted-foreground">Predictive finance</p>
          </div>
        </div>

        <div className="mesh-card mt-3 rounded-xl border border-border/60 p-3">
          <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Trust Center</p>
          <p className="mt-1 text-xs font-medium leading-relaxed">Your plan stays on-device.</p>
          <div className="mt-2 flex gap-1.5">
            <button
              type="button"
              onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
              className="inline-flex items-center gap-1.5 rounded-full border border-border/70 bg-card/90 px-2.5 py-1.5 text-[10px] font-semibold"
            >
              {resolvedTheme === "dark" ? <SunMedium className="h-3 w-3" /> : <Moon className="h-3 w-3" />}
              {resolvedTheme === "dark" ? "Light" : "Dark"}
            </button>
            <button
              type="button"
              className="inline-flex items-center gap-1.5 rounded-full border border-border/70 bg-card/90 px-2.5 py-1.5 text-[10px] font-semibold"
            >
              <Download className="h-3 w-3" />
              Export
            </button>
          </div>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-3">
        <ul className="space-y-0.5">
          {NAV_ITEMS.map(({ href, label, icon: Icon, guided }) => {
            const active = pathname === href || pathname.startsWith(href + "/");
            const guidedState = guided && href in routeState ? routeState[href as keyof typeof routeState] : null;
            const isLocked = guidedState?.locked ?? false;
            const showNotSetup = href === "/salary" && !loading && !flags.incomeExists;
            const showReady = guidedState?.ready && href !== "/salary";

            return (
              <li key={href} className="relative">
                <div className="flex items-center gap-2">
                  {isLocked ? (
                    <button
                      type="button"
                      onClick={() => openSetupPopover(href)}
                      className={cn(
                        "flex flex-1 items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-medium transition-all duration-200",
                        "text-muted-foreground hover:bg-[hsl(var(--sidebar-accent))] hover:text-foreground"
                      )}
                    >
                      <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-card/60">
                        <Lock className="h-3.5 w-3.5" />
                      </span>
                      <span className="flex-1 text-left">{label}</span>
                    </button>
                  ) : (
                    <Link
                      href={href}
                      className={cn(
                        "flex flex-1 items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-medium transition-all duration-200",
                        active
                          ? "bg-primary/12 text-primary shadow-[inset_0_0_0_1px_hsl(var(--primary)/0.18)]"
                          : "text-muted-foreground hover:bg-[hsl(var(--sidebar-accent))] hover:text-foreground"
                      )}
                    >
                      <span className={cn("flex h-7 w-7 items-center justify-center rounded-lg border border-transparent", active ? "bg-primary/12" : "bg-card/60")}>
                        <Icon className="h-3.5 w-3.5" />
                      </span>
                      <span className="flex-1">{label}</span>
                      {showNotSetup ? <span className="rounded-full border border-amber-500/30 bg-amber-500/10 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-[0.14em] text-amber-700 dark:text-amber-300">Not set up</span> : null}
                      {showReady ? <span className="inline-flex h-2 w-2 rounded-full bg-emerald-500" /> : null}
                      {active ? <ChevronRight className="h-3.5 w-3.5" /> : null}
                    </Link>
                  )}

                  {guided ? (
                    <button
                      type="button"
                      ref={(el) => { popoverBtnRefs.current[href] = el; }}
                      onClick={() => openSetupPopover(href)}
                      className="inline-flex h-7 w-7 items-center justify-center rounded-lg border border-border/70 bg-card/70 text-muted-foreground transition hover:text-foreground"
                      aria-label={`About ${label}`}
                    >
                      <Info className="h-3.5 w-3.5" />
                    </button>
                  ) : null}
                </div>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="border-t border-[hsl(var(--sidebar-border))] px-3 py-3 shrink-0">
        {user && (
          <div className="rounded-xl border border-border/70 bg-card/70 p-3">
            <p className="truncate text-xs font-semibold text-foreground">{user.name}</p>
            <p className="truncate text-[10px] text-muted-foreground">{user.email}</p>
          </div>
        )}
        <div className="mt-2 flex gap-1.5">
          <Link href="/settings" className="flex-1 rounded-full border border-border/70 bg-card/70 px-3 py-1.5 text-center text-[11px] font-semibold transition hover:text-primary">
            Preferences
          </Link>
          <button onClick={logout} className="inline-flex items-center gap-1.5 rounded-full border border-border/70 bg-card/70 px-3 py-1.5 text-[11px] font-semibold text-muted-foreground transition hover:text-destructive">
            <LogOut className="h-3 w-3" />
            Logout
          </button>
        </div>
      </div>
    </aside>

    {/* Portal-based popover — renders at document.body so it's above everything */}
    {mounted && openPopover && popoverPos && (openPopover in POPOVER_COPY) && createPortal(
      <>
        {/* Click-outside backdrop */}
        <div className="fixed inset-0 z-[9998]" onClick={() => { setOpenPopover(null); setPopoverPos(null); }} />
        {/* Popover card */}
        <div
          className="fixed z-[9999] w-64 rounded-xl border border-border bg-card p-3 shadow-2xl"
          style={{ top: popoverPos.top, left: popoverPos.left }}
        >
          <p className="text-xs font-semibold text-foreground">{POPOVER_COPY[openPopover as keyof typeof POPOVER_COPY].title}</p>
          <p className="mt-1.5 text-[10px] uppercase tracking-[0.16em] text-muted-foreground">What you&apos;ll see</p>
          <p className="mt-0.5 text-[11px] leading-4 text-muted-foreground">{POPOVER_COPY[openPopover as keyof typeof POPOVER_COPY].what}</p>
          <p className="mt-2 text-[10px] uppercase tracking-[0.16em] text-muted-foreground">To unlock</p>
          <p className="mt-0.5 text-[11px] leading-4 text-muted-foreground">{POPOVER_COPY[openPopover as keyof typeof POPOVER_COPY].unlock}</p>
          <button
            type="button"
            onClick={() => {
              setOpenPopover(null);
              setPopoverPos(null);
              router.push("/dashboard?setup=1");
            }}
            className="mt-3 inline-flex rounded-full border border-primary/25 bg-primary/10 px-3 py-1.5 text-[11px] font-semibold text-primary transition hover:bg-primary/15"
          >
            {POPOVER_COPY[openPopover as keyof typeof POPOVER_COPY].cta}
          </button>
        </div>
      </>,
      document.body
    )}
    </>
  );
}
