"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState, Skeleton } from "@/components/ui/shared";
import { fetchLatestNews } from "@/lib/api";
import type { NewsArticle } from "@/types/api";
import { useCallback, useEffect, useState } from "react";

// Fixed filters — category "business" + financial keyword query to ensure
// only finance/market/economy news comes through, not sports or general news
// that ET/Moneycontrol happen to tag as "business".
const FIXED_CATEGORY = "business";
const FIXED_QUERY =
  "stock market OR sensex OR nifty OR RBI OR inflation OR IPO OR rupee OR equity OR banking OR forex";

const COUNTRY_OPTIONS = [
  { label: "India", value: "in" },
  { label: "Global", value: "" },
] as const;

const PAGE_SIZE = 10;
const INITIAL_VISIBLE = 6;
const LOAD_MORE_STEP = 2;

function formatPubDate(pubDate?: string, pubDateTZ?: string): string {
  if (!pubDate) return "";
  const normalized = pubDate.includes("T") ? pubDate : pubDate.replace(" ", "T");
  const parsed = new Date(`${normalized}Z`);
  if (Number.isNaN(parsed.getTime())) return pubDate;

  const datePart = new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "2-digit",
    year: "numeric",
    timeZone: "UTC",
  }).format(parsed);
  const timePart = new Intl.DateTimeFormat("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: "UTC",
  }).format(parsed);

  return `${datePart} · ${timePart} ${pubDateTZ ?? "UTC"}`;
}

export default function NewsPage() {
  const [allNews, setAllNews] = useState<NewsArticle[]>([]);
  const [visibleCount, setVisibleCount] = useState(INITIAL_VISIBLE);
  const [country, setCountry] = useState<string>("in");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadNews = useCallback(async () => {
    setLoading(true);
    setError("");
    setVisibleCount(INITIAL_VISIBLE);
    try {
      const payload = await fetchLatestNews({
        q: FIXED_QUERY,
        country: country || null,
        category: FIXED_CATEGORY,
        language: "en",
        size: PAGE_SIZE,
        page: null,
      });
      setAllNews(payload.upstream.results ?? []);
    } catch (e) {
      setAllNews([]);
      setError(e instanceof Error ? e.message : "Failed to load news. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [country]);

  useEffect(() => {
    void loadNews();
  }, [loadNews]);

  const visibleNews = allNews.slice(0, visibleCount);
  const hasMore = visibleCount < allNews.length;
  const hasNoResults = !loading && !error && allNews.length === 0;

  return (
    <div>
      {/* ── Header row ── */}
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold">Latest News &amp; Updates</h1>

        <div className="flex items-center gap-1.5">
          <span className="text-xs font-medium text-muted-foreground">Country</span>
          <select
            className="h-8 rounded-md border border-border bg-background px-2 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
            value={country}
            onChange={(e) => setCountry(e.target.value)}
          >
            {COUNTRY_OPTIONS.map((opt) => (
              <option key={opt.value || "global"} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* ── States ── */}
      {loading ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: INITIAL_VISIBLE }).map((_, i) => (
            <Skeleton key={i} className="h-36" />
          ))}
        </div>
      ) : error ? (
        <div className="rounded-xl border border-destructive/25 bg-destructive/10 px-5 py-6 text-destructive">
          <p className="text-sm font-medium">Failed to load news. Please try again.</p>
          <p className="mt-1 text-xs opacity-80">{error}</p>
          <Button className="mt-3" size="sm" variant="outline" onClick={() => void loadNews()}>
            Retry
          </Button>
        </div>
      ) : hasNoResults ? (
        <EmptyState message="No news found for the selected filters." title="No news found" />
      ) : (
        <>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {visibleNews.map((article) => (
              <Card
                key={article.article_id ?? article.link ?? article.title}
                className="flex flex-col justify-between overflow-hidden transition-shadow hover:shadow-md"
              >
                <CardHeader className="pb-1 pt-4 px-4">
                  <CardTitle className="text-sm font-semibold leading-5">
                    {article.link ? (
                      <a
                        href={article.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="hover:text-primary hover:underline underline-offset-2 transition-colors cursor-pointer"
                        onClick={(e) => {
                          e.stopPropagation();
                          window.open(article.link, "_blank", "noopener,noreferrer");
                        }}
                      >
                        {article.title ?? "Untitled"}
                      </a>
                    ) : (
                      <span>{article.title ?? "Untitled"}</span>
                    )}
                  </CardTitle>
                </CardHeader>

                <CardContent className="px-4 pb-4 pt-1 flex flex-col gap-2">
                  {article.description ? (
                    <p className="text-xs text-muted-foreground line-clamp-3 leading-relaxed">
                      {article.description.trim()}
                    </p>
                  ) : null}

                  <div className="flex items-center gap-1.5 mt-auto pt-1">
                    {article.source_icon ? (
                      <img
                        src={article.source_icon}
                        alt={article.source_name ?? "source"}
                        className="h-3.5 w-3.5 rounded-sm object-cover flex-shrink-0"
                        loading="lazy"
                      />
                    ) : null}
                    <span className="text-xs font-medium text-foreground/80 truncate">
                      {article.source_name ?? "Unknown source"}
                    </span>
                    {article.pubDate ? (
                      <>
                        <span className="text-xs text-muted-foreground">·</span>
                        <span className="text-xs text-muted-foreground truncate">
                          {formatPubDate(article.pubDate, article.pubDateTZ)}
                        </span>
                      </>
                    ) : null}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {hasMore && (
            <div className="mt-5 flex justify-center">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setVisibleCount((prev) => prev + LOAD_MORE_STEP)}
              >
                Load more
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}