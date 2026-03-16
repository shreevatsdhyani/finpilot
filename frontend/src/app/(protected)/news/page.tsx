"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge, EmptyState, ErrorState, LoadingState } from "@/components/ui/shared";
import { listNews, summarizeNews } from "@/lib/api";
import type { NewsItem } from "@/types/api";
import { useEffect, useState } from "react";

export default function NewsPage() {
  const [news, setNews] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [summaries, setSummaries] = useState<Record<string, string>>({});

  useEffect(() => {
    listNews().then(setNews).catch((e) => setError(e.message)).finally(() => setLoading(false));
  }, []);

  async function handleSummarize(id: string) {
    try {
      const s = await summarizeNews(id);
      setSummaries((p) => ({ ...p, [id]: s.summary }));
    } catch {}
  }

  if (loading) return <LoadingState />;
  if (error) return <ErrorState message={error} />;

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">Financial News</h1>
      {news.length === 0 ? (
        <EmptyState message="No news available." />
      ) : (
        <div className="space-y-3">
          {news.map((n) => (
            <Card key={n.id}>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">{n.title}</CardTitle>
                  <Badge>{n.category}</Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                <p className="text-sm text-muted-foreground">{summaries[n.id] ?? n.summary}</p>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={() => handleSummarize(n.id)}>
                    Summarize
                  </Button>
                  {n.url && (
                    <a href={n.url} target="_blank" rel="noopener noreferrer">
                      <Button size="sm" variant="ghost">Read more →</Button>
                    </a>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
