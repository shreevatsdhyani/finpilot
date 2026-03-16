"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState, ErrorState, LoadingState } from "@/components/ui/shared";
import { generateRecommendations, listRecommendations } from "@/lib/api";
import type { Recommendation } from "@/types/api";
import { useEffect, useState } from "react";

export default function InvestmentsPage() {
  const [recs, setRecs] = useState<Recommendation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    listRecommendations().then(setRecs).catch((e) => setError(e.message)).finally(() => setLoading(false));
  }, []);

  async function handleGenerate() {
    setGenerating(true);
    try {
      const r = await generateRecommendations();
      setRecs((p) => [r, ...p]);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed");
    } finally {
      setGenerating(false);
    }
  }

  if (loading) return <LoadingState />;
  if (error) return <ErrorState message={error} />;

  const latest = recs[0] ?? null;

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Investment Recommendations</h1>
        <Button onClick={handleGenerate} disabled={generating}>
          {generating ? "Generating…" : "Generate New"}
        </Button>
      </div>

      {!latest ? (
        <EmptyState message="No recommendations yet. Click Generate to get started." />
      ) : (
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">
                Safe to Invest: <span className="text-primary">₹{latest.safe_to_invest.toLocaleString()}/mo</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {latest.buckets.map((b) => (
                  <div key={b.name} className="flex items-center gap-4">
                    <div className="h-3 rounded-full bg-primary/20" style={{ width: `${b.allocation_pct}%`, minWidth: "1rem" }} />
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <span className="font-medium">{b.name}</span>
                        <span className="text-sm font-semibold">{b.allocation_pct}%</span>
                      </div>
                      <p className="text-xs text-muted-foreground">{b.rationale}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {recs.length > 1 && (
            <div>
              <h2 className="mb-2 text-lg font-semibold">History</h2>
              <div className="space-y-2">
                {recs.slice(1).map((r) => (
                  <Card key={r.id}>
                    <CardContent className="flex items-center justify-between py-3">
                      <span className="text-sm text-muted-foreground">{r.created_at ? new Date(r.created_at).toLocaleDateString() : "—"}</span>
                      <span className="font-medium">₹{r.safe_to_invest.toLocaleString()}/mo</span>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
