"use client";

import { Sidebar } from "@/components/sidebar";
import { Button } from "@/components/ui/button";
import { Badge, LoadingState, Skeleton } from "@/components/ui/shared";
import { useAuth } from "@/context/auth-context";
import { ReadinessProvider, useReadiness } from "@/context/readiness-context";
import type { Scenario } from "@/types/api";
import { AlertTriangle, Download, ShieldCheck } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useMemo, useRef } from "react";
import { toast } from "sonner";

function formatDate(value: string | null | undefined) {
  if (!value) return "Awaiting input";
  return new Date(value).toLocaleDateString("en-IN", { day: "numeric", month: "short" });
}

export default function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.replace("/auth/login");
    }
  }, [loading, user, router]);

  if (loading) return <LoadingState />;
  if (!user) return null;

  return (
    <ReadinessProvider>
      <ProtectedShell>{children}</ProtectedShell>
    </ReadinessProvider>
  );
}

function readinessRoute(pathname: string): "/cashflow" | "/scenarios" | "/investments" | null {
  if (pathname.startsWith("/cashflow")) return "/cashflow";
  if (pathname.startsWith("/scenarios")) return "/scenarios";
  if (pathname.startsWith("/investments")) return "/investments";
  return null;
}

function ProtectedShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user } = useAuth();
  const { loading, error, refresh, salaryDocs, expenses, forecasts, scenarios, settings, lockedRoutes } = useReadiness();
  const redirectedRef = useRef<string | null>(null);

  useEffect(() => {
    const route = readinessRoute(pathname);
    if (!route || loading || error) return;
    if (!lockedRoutes[route]) {
      redirectedRef.current = null;
      return;
    }
    if (redirectedRef.current === route) return;
    redirectedRef.current = route;
    toast.error("Complete setup on Dashboard to unlock this section.");
    router.replace("/dashboard?setup=1");
  }, [pathname, loading, error, lockedRoutes, router]);

  const latestSalary = useMemo(
    () => salaryDocs.slice().sort((a, b) => (b.created_at ?? "").localeCompare(a.created_at ?? ""))[0],
    [salaryDocs]
  );
  const latestExpenseDate = useMemo(
    () => expenses.slice().sort((a, b) => (b.date ?? "").localeCompare(a.date ?? ""))[0]?.date,
    [expenses]
  );
  const latestForecast = useMemo(
    () => forecasts.slice().sort((a, b) => (b.created_at ?? "").localeCompare(a.created_at ?? ""))[0],
    [forecasts]
  );
  const activeScenario = useMemo<Scenario | null>(
    () => scenarios.find((item) => item.active) ?? null,
    [scenarios]
  );

  const riskProfile = settings?.locale ? "Balanced" : "Balanced";

  return (
    <div className="flex h-screen overflow-hidden bg-transparent">
      {/* Fixed sidebar */}
      <Sidebar />

      {/* Right side: scrollable content area */}
      <div className="flex min-w-0 flex-1 flex-col h-screen overflow-y-auto">
        <header className="sticky top-0 z-30 border-b border-border/70 bg-background/80 px-5 py-3 backdrop-blur xl:px-8 shrink-0">
          <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
            <div>
              <p className="text-[10px] uppercase tracking-[0.24em] text-muted-foreground">Local-first predictive finance</p>
              <h2 className="mt-0.5 text-lg font-semibold">{user?.name ? `Welcome back, ${user.name.split(" ")[0]}` : "Welcome"}</h2>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Badge className="border-primary/25 bg-primary/10 text-primary text-xs">Local mode</Badge>
              <button type="button" className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1.5 text-xs font-semibold transition hover:text-primary">
                <Download className="h-3.5 w-3.5" />
                Export PDF
              </button>
            </div>
          </div>

          {error ? (
            <div className="mt-3 flex items-center justify-between rounded-xl border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-700 dark:text-amber-300">
              <span>Couldn&apos;t load setup status.</span>
              <Button variant="outline" size="sm" onClick={() => void refresh()}>
                Retry
              </Button>
            </div>
          ) : null}

          <div className="mt-3 grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
            <div className="rounded-xl border border-border/80 bg-card/70 px-3 py-2">
              <p className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">Income source</p>
              {loading ? <Skeleton className="mt-1.5 h-8 w-full" /> : <>
                <p className="mt-1 text-xs font-semibold truncate">{latestSalary ? latestSalary.filename : "Upload salary slips"}</p>
                <p className="text-[10px] text-muted-foreground">Updated {formatDate(latestSalary?.created_at)}</p>
              </>}
            </div>
            <div className="rounded-xl border border-border/80 bg-card/70 px-3 py-2">
              <p className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">Expenses baseline</p>
              {loading ? <Skeleton className="mt-1.5 h-8 w-full" /> : <>
                <p className="mt-1 text-xs font-semibold">{expenses.length > 0 ? `${expenses.length} entries mapped` : "No baseline yet"}</p>
                <p className="text-[10px] text-muted-foreground">Updated {formatDate(latestExpenseDate)}</p>
              </>}
            </div>
            <div className="rounded-xl border border-border/80 bg-card/70 px-3 py-2">
              <p className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">Active scenario</p>
              {loading ? <Skeleton className="mt-1.5 h-8 w-full" /> : <>
                <p className="mt-1 text-xs font-semibold truncate">{activeScenario?.name ?? "Baseline plan"}</p>
                <p className="text-[10px] text-muted-foreground">{activeScenario ? "Scenario active" : "No scenario"}</p>
              </>}
            </div>
            <div className="rounded-xl border border-border/80 bg-card/70 px-3 py-2">
              <p className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">Risk profile</p>
              {loading ? <Skeleton className="mt-1.5 h-8 w-full" /> : <>
                <div className="mt-1 flex items-center gap-1.5 text-xs font-semibold">
                  <ShieldCheck className="h-3.5 w-3.5 text-primary" />
                  {riskProfile}
                </div>
                <p className="flex items-center gap-1 text-[10px] text-muted-foreground">
                  <AlertTriangle className="h-3 w-3" />
                  {latestForecast ? `Generated ${formatDate(latestForecast.created_at)}` : "Not generated yet"}
                </p>
              </>}
            </div>
          </div>
        </header>

        <main className="min-w-0 flex-1 px-5 py-5 xl:px-8">
          <div className="mx-auto max-w-[1400px]">{children}</div>
        </main>
      </div>
    </div>
  );
}
