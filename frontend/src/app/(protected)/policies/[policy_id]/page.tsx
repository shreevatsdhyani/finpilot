"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge, ErrorState, LoadingState } from "@/components/ui/shared";
import { getPolicy, subscribePolicy } from "@/lib/api";
import { cn } from "@/lib/utils";
import type { Policy } from "@/types/api";
import {
  ArrowLeft,
  Bell,
  BellOff,
  BookOpen,
  Calendar,
  CheckCircle2,
  ExternalLink,
  Globe,
  Shield,
  Tag,
} from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";

const CATEGORY_META: Record<string, { label: string; color: string }> = {
  tax: { label: "Tax", color: "bg-blue-500/15 text-blue-600 dark:text-blue-400 border-blue-500/25" },
  rates: { label: "Rates", color: "bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/25" },
  insurance: { label: "Insurance", color: "bg-violet-500/15 text-violet-600 dark:text-violet-400 border-violet-500/25" },
  investing: { label: "Investing", color: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/25" },
  credit: { label: "Credit", color: "bg-rose-500/15 text-rose-600 dark:text-rose-400 border-rose-500/25" },
  savings: { label: "Savings", color: "bg-teal-500/15 text-teal-600 dark:text-teal-400 border-teal-500/25" },
};

export default function PolicyDetailPage() {
  const params = useParams();
  const id = params.policy_id as string;
  const [policy, setPolicy] = useState<Policy | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [subscribed, setSubscribed] = useState(false);

  useEffect(() => {
    getPolicy(id)
      .then(setPolicy)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [id]);

  async function handleSubscribe() {
    try {
      await subscribePolicy(id);
      setSubscribed(true);
    } catch {}
  }

  if (loading) return <LoadingState />;
  if (error) return <ErrorState message={error} />;
  if (!policy) return null;

  const meta = CATEGORY_META[policy.category] ?? {
    label: policy.category,
    color: "bg-secondary/70 text-secondary-foreground border-border/70",
  };

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      {/* Back link */}
      <Link
        href="/policies"
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground transition hover:text-primary"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Back to all policies
      </Link>

      {/* Header card */}
      <Card className="border-border/70 overflow-hidden">
        <div className="bg-gradient-to-br from-primary/5 via-card to-card p-5 sm:p-6">
          {/* Chips row */}
          <div className="flex flex-wrap items-center gap-1.5 mb-3">
            <span className={cn("rounded-full border px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-widest", meta.color)}>
              {meta.label}
            </span>
            <span className="inline-flex items-center gap-1 rounded-full border border-border/50 bg-muted/40 px-2 py-0.5 text-[10px] text-muted-foreground">
              <Globe className="h-2.5 w-2.5" />
              {policy.region}
            </span>
            <span className="inline-flex items-center gap-1 rounded-full border border-border/50 bg-muted/40 px-2 py-0.5 text-[10px] text-muted-foreground">
              v{policy.version}
            </span>
          </div>

          {/* Title */}
          <h1 className="text-xl font-semibold text-foreground leading-snug sm:text-2xl">
            {policy.title}
          </h1>

          {/* Summary */}
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            {policy.summary}
          </p>

          {/* Dates row */}
          <div className="mt-4 flex flex-wrap items-center gap-4 text-[10px] text-muted-foreground">
            {policy.effective_from && (
              <span className="inline-flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                Effective from {new Date(policy.effective_from).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
              </span>
            )}
            {policy.published_at && (
              <span className="inline-flex items-center gap-1">
                <BookOpen className="h-3 w-3" />
                Published {new Date(policy.published_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
              </span>
            )}
            {policy.last_updated && (
              <span className="inline-flex items-center gap-1">
                <CheckCircle2 className="h-3 w-3" />
                Updated {new Date(policy.last_updated).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
              </span>
            )}
          </div>
        </div>
      </Card>

      {/* Full body */}
      <Card className="border-border/70">
        <CardContent className="p-5 sm:p-6">
          <h2 className="flex items-center gap-2 text-sm font-semibold text-foreground mb-3">
            <Shield className="h-4 w-4 text-primary" />
            Full Policy Text
          </h2>
          <div className="text-sm leading-7 text-foreground/90 whitespace-pre-line">
            {policy.body}
          </div>
        </CardContent>
      </Card>

      {/* Tags */}
      {policy.tags.length > 0 && (
        <Card className="border-border/70">
          <CardContent className="p-4">
            <h3 className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-widest">Related Tags</h3>
            <div className="flex flex-wrap gap-1.5">
              {policy.tags.map((tag) => (
                <span key={tag} className="inline-flex items-center gap-1 rounded-lg border border-border/60 bg-muted/30 px-2.5 py-1 text-[11px] font-medium text-muted-foreground">
                  <Tag className="h-2.5 w-2.5" />
                  {tag}
                </span>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Source + Subscribe */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        {policy.source_url && (
          <a
            href={policy.source_url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary transition hover:opacity-80"
          >
            <ExternalLink className="h-3.5 w-3.5" />
            View original source{policy.source_name ? ` — ${policy.source_name}` : ""}
          </a>
        )}
        <Button
          size="sm"
          variant={subscribed ? "secondary" : "default"}
          onClick={handleSubscribe}
          disabled={subscribed}
          className="gap-1.5"
        >
          {subscribed ? <BellOff className="h-3.5 w-3.5" /> : <Bell className="h-3.5 w-3.5" />}
          {subscribed ? "Subscribed ✓" : "Subscribe to Updates"}
        </Button>
      </div>
    </div>
  );
}
