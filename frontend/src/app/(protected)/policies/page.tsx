"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge, EmptyState, ErrorState, LoadingState, SectionIntro } from "@/components/ui/shared";
import { listPolicies } from "@/lib/api";
import { cn } from "@/lib/utils";
import type { Policy } from "@/types/api";
import { ExternalLink, Filter, Search, Shield, Tag } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";

const CATEGORY_META: Record<string, { label: string; color: string }> = {
  tax: { label: "Tax", color: "bg-blue-500/15 text-blue-600 dark:text-blue-400 border-blue-500/25" },
  rates: { label: "Rates", color: "bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/25" },
  insurance: { label: "Insurance", color: "bg-violet-500/15 text-violet-600 dark:text-violet-400 border-violet-500/25" },
  investing: { label: "Investing", color: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/25" },
  credit: { label: "Credit", color: "bg-rose-500/15 text-rose-600 dark:text-rose-400 border-rose-500/25" },
  savings: { label: "Savings", color: "bg-teal-500/15 text-teal-600 dark:text-teal-400 border-teal-500/25" },
};

export default function PoliciesPage() {
  const [policies, setPolicies] = useState<Policy[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  useEffect(() => {
    listPolicies()
      .then(setPolicies)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  // Derive categories from loaded policies
  const categories = useMemo(() => {
    const cats = [...new Set(policies.map((p) => p.category))];
    return cats.sort();
  }, [policies]);

  // Filter policies by search and category
  const filtered = useMemo(() => {
    let result = policies;
    if (activeCategory) {
      result = result.filter((p) => p.category === activeCategory);
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (p) =>
          p.title.toLowerCase().includes(q) ||
          p.summary.toLowerCase().includes(q) ||
          p.tags.some((t) => t.toLowerCase().includes(q))
      );
    }
    return result;
  }, [policies, activeCategory, search]);

  const clearFilters = useCallback(() => {
    setActiveCategory(null);
    setSearch("");
  }, []);

  if (loading) return <LoadingState />;
  if (error) return <ErrorState message={error} />;

  return (
    <div className="space-y-5">
      <SectionIntro
        eyebrow="Knowledge Base"
        title="Financial Policies & Guidelines"
        description="Curated Indian financial policies from RBI, SEBI, Income Tax, and IRDAI. Search, filter, and understand the rules that impact your finances."
      />

      {/* ── Search + Category Filters ── */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search policies, tags…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 h-9 text-xs rounded-xl"
          />
        </div>
        <div className="flex flex-wrap items-center gap-1.5">
          <Filter className="h-3.5 w-3.5 text-muted-foreground" />
          <button
            onClick={() => setActiveCategory(null)}
            className={cn(
              "rounded-full border px-2.5 py-1 text-[10px] font-semibold transition",
              !activeCategory
                ? "border-primary/30 bg-primary/10 text-primary"
                : "border-border/70 bg-card/80 text-muted-foreground hover:text-foreground"
            )}
          >
            All ({policies.length})
          </button>
          {categories.map((cat) => {
            const meta = CATEGORY_META[cat] ?? { label: cat, color: "bg-secondary/70 text-secondary-foreground border-border/70" };
            const count = policies.filter((p) => p.category === cat).length;
            return (
              <button
                key={cat}
                onClick={() => setActiveCategory(activeCategory === cat ? null : cat)}
                className={cn(
                  "rounded-full border px-2.5 py-1 text-[10px] font-semibold transition capitalize",
                  activeCategory === cat
                    ? meta.color
                    : "border-border/70 bg-card/80 text-muted-foreground hover:text-foreground"
                )}
              >
                {meta.label} ({count})
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Region chip ── */}
      <div className="flex items-center gap-2">
        <Shield className="h-3.5 w-3.5 text-muted-foreground" />
        <span className="rounded-full border border-border/70 bg-card/80 px-2.5 py-0.5 text-[10px] font-semibold text-muted-foreground">
          🇮🇳 India
        </span>
        <span className="text-[10px] text-muted-foreground">
          {filtered.length} {filtered.length === 1 ? "policy" : "policies"} found
        </span>
        {(activeCategory || search) && (
          <button onClick={clearFilters} className="text-[10px] text-primary font-semibold hover:underline">
            Clear filters
          </button>
        )}
      </div>

      {/* ── Policy Cards Grid ── */}
      {filtered.length === 0 ? (
        <EmptyState
          message="No policies match your search. Try a different keyword or clear filters."
          title="No matching policies"
        />
      ) : (
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map((p) => {
            const meta = CATEGORY_META[p.category] ?? { label: p.category, color: "bg-secondary/70 text-secondary-foreground border-border/70" };
            return (
              <Link key={p.id} href={`/policies/${p.id}`}>
                <Card className="group h-full cursor-pointer border-border/70 transition-all duration-200 hover:border-primary/40 hover:shadow-lg hover:-translate-y-0.5">
                  <CardContent className="p-4 flex flex-col h-full">
                    {/* Category + region */}
                    <div className="flex items-center gap-1.5 mb-2">
                      <span className={cn("rounded-full border px-2 py-0.5 text-[9px] font-semibold uppercase tracking-widest", meta.color)}>
                        {meta.label}
                      </span>
                      <span className="rounded-full border border-border/50 bg-muted/40 px-1.5 py-0.5 text-[9px] text-muted-foreground">
                        🇮🇳
                      </span>
                    </div>

                    {/* Title */}
                    <h3 className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors leading-snug">
                      {p.title}
                    </h3>

                    {/* Summary */}
                    <p className="mt-1.5 text-[11px] leading-relaxed text-muted-foreground line-clamp-3 flex-1">
                      {p.summary}
                    </p>

                    {/* Tags */}
                    {p.tags.length > 0 && (
                      <div className="mt-2.5 flex flex-wrap gap-1">
                        {p.tags.slice(0, 4).map((tag) => (
                          <span key={tag} className="inline-flex items-center gap-0.5 rounded-md border border-border/50 bg-muted/30 px-1.5 py-0.5 text-[9px] text-muted-foreground">
                            <Tag className="h-2 w-2" />
                            {tag}
                          </span>
                        ))}
                        {p.tags.length > 4 && (
                          <span className="text-[9px] text-muted-foreground">+{p.tags.length - 4}</span>
                        )}
                      </div>
                    )}

                    {/* Source + date */}
                    <div className="mt-3 pt-2 border-t border-border/40 flex items-center justify-between">
                      {p.source_name && (
                        <span className="text-[9px] text-muted-foreground truncate max-w-[60%]">
                          Source: {p.source_name}
                        </span>
                      )}
                      {p.effective_from && (
                        <span className="text-[9px] text-muted-foreground">
                          Effective {new Date(p.effective_from).toLocaleDateString("en-IN", { month: "short", year: "numeric" })}
                        </span>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
