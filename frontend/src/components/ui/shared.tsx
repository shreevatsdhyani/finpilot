import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";
import Link from "next/link";

export function Badge({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border border-border/80 bg-secondary/70 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-secondary-foreground",
        className
      )}
    >
      {children}
    </span>
  );
}

export function Spinner({ className }: { className?: string }) {
  return <Loader2 className={cn("h-6 w-6 animate-spin text-muted-foreground", className)} />;
}

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn("animate-pulse rounded-xl bg-muted/80", className)} />;
}

export function EmptyState({
  message,
  title = "Nothing here yet",
  actionLabel,
  actionHref,
}: {
  message: string;
  title?: string;
  actionLabel?: string;
  actionHref?: string;
}) {
  return (
    <div className="mesh-card section-grid rounded-xl border border-dashed border-border/80 px-5 py-10 text-center text-muted-foreground">
      <p className="text-lg font-semibold text-foreground">{title}</p>
      <p className="mx-auto mt-2 max-w-xl text-sm leading-6">{message}</p>
      {actionLabel && actionHref ? (
        <Link
          href={actionHref}
          className="mt-5 inline-flex rounded-full border border-border/80 bg-card px-4 py-2 text-sm font-semibold text-foreground transition hover:border-primary/40 hover:text-primary"
        >
          {actionLabel}
        </Link>
      ) : null}
    </div>
  );
}

export function ErrorState({ message }: { message: string }) {
  return (
    <div className="rounded-xl border border-destructive/25 bg-destructive/10 px-5 py-6 text-destructive">
      <p className="text-base font-medium">Something went wrong</p>
      <p className="mt-1 text-xs">{message}</p>
    </div>
  );
}

export function LoadingState() {
  return (
    <div className="space-y-4 py-6">
      <Skeleton className="h-10 w-64" />
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Skeleton className="h-36" />
        <Skeleton className="h-36" />
        <Skeleton className="h-36" />
        <Skeleton className="h-36" />
      </div>
      <Skeleton className="h-80" />
    </div>
  );
}

export function SectionIntro({
  eyebrow,
  title,
  description,
  actions,
}: {
  eyebrow?: string;
  title: string;
  description: string;
  actions?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
      <div className="space-y-1.5">
        {eyebrow ? <Badge>{eyebrow}</Badge> : null}
        <div>
          <h1 className="text-2xl font-semibold">{title}</h1>
          <p className="mt-1 max-w-3xl text-xs leading-5 text-muted-foreground sm:text-sm">{description}</p>
        </div>
      </div>
      {actions ? <div className="flex flex-wrap items-center gap-3">{actions}</div> : null}
    </div>
  );
}
