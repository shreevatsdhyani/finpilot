import { Badge } from "@/components/ui/shared";
import { cn } from "@/lib/utils";
import { ArrowDownRight, ArrowUpRight, Dot } from "lucide-react";
import Link from "next/link";

export function KpiCard({
  label,
  value,
  detail,
  tone = "default",
  href,
}: {
  label: string;
  value: string;
  detail: string;
  tone?: "default" | "success" | "warning" | "danger";
  href?: string;
}) {
  const toneClass = {
    default: "text-foreground",
    success: "text-emerald-600 dark:text-emerald-400",
    warning: "text-amber-600 dark:text-amber-400",
    danger: "text-rose-600 dark:text-rose-400",
  }[tone];

  return (
    <div className="mesh-card rounded-xl border border-border/80 p-4 soft-shadow">
      <div className="flex items-center justify-between gap-2">
        <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">{label}</p>
        {href ? (
          <Link href={href} className="text-[10px] font-semibold text-primary transition hover:opacity-80">
            Edit
          </Link>
        ) : null}
      </div>
      <p className={cn("mt-2 text-xl font-semibold", toneClass)}>{value}</p>
      <p className="mt-1 text-[11px] text-muted-foreground leading-relaxed">{detail}</p>
    </div>
  );
}

export function PanelTitle({
  badge,
  title,
  description,
  action,
}: {
  badge?: string;
  title: string;
  description: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
      <div>
        {badge ? <Badge className="text-[10px]">{badge}</Badge> : null}
        <h2 className="mt-1.5 text-lg font-semibold">{title}</h2>
        <p className="mt-0.5 text-xs leading-5 text-muted-foreground">{description}</p>
      </div>
      {action ? <div>{action}</div> : null}
    </div>
  );
}

export function TrustList({ items }: { items: Array<{ label: string; value: string }> }) {
  return (
    <div className="space-y-3 rounded-[1.25rem] border border-border/80 bg-muted/30 p-4">
      {items.map((item) => (
        <div key={item.label} className="flex items-center justify-between gap-3 border-b border-border/60 pb-3 last:border-b-0 last:pb-0">
          <p className="text-sm text-muted-foreground">{item.label}</p>
          <p className="text-sm font-semibold">{item.value}</p>
        </div>
      ))}
    </div>
  );
}

export function TrendPill({ value, positiveLabel, negativeLabel }: { value: number; positiveLabel: string; negativeLabel: string }) {
  const positive = value >= 0;
  return (
    <div
      className={cn(
        "inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-semibold",
        positive ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" : "bg-rose-500/10 text-rose-600 dark:text-rose-400"
      )}
    >
      {positive ? <ArrowUpRight className="h-3.5 w-3.5" /> : <ArrowDownRight className="h-3.5 w-3.5" />}
      {positive ? positiveLabel : negativeLabel}
    </div>
  );
}

export function AuditLink({ auditId }: { auditId?: string | null }) {
  if (!auditId) return null;
  return (
    <Link href={`/audit/${auditId}`} className="inline-flex items-center gap-2 text-sm font-semibold text-primary transition hover:opacity-80">
      View audit
      <Dot className="h-4 w-4" />
    </Link>
  );
}