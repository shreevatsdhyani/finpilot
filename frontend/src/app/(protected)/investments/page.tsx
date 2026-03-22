"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState, ErrorState, LoadingState, Badge } from "@/components/ui/shared";
import { generateRecommendations, listRecommendations } from "@/lib/api";
import type { Recommendation } from "@/types/api";
import { Wallet, PieChart as PieIcon, Shield, TrendingUp } from "lucide-react";
import { useEffect, useState } from "react";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from "recharts";

const COLORS = ["#6366f1", "#10b981", "#f59e0b", "#8b5cf6", "#06b6d4"];
const RISK_LABELS: Record<string, { label: string; color: string }> = {
  conservative: { label: "Conservative", color: "text-blue-600" },
  moderate: { label: "Moderate", color: "text-amber-600" },
  aggressive: { label: "Aggressive", color: "text-red-500" },
};

export default function InvestmentsPage() {
  const [recs, setRecs] = useState<Recommendation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [generating, setGenerating] = useState(false);
  const [riskProfile, setRiskProfile] = useState("moderate");

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
  const riskInfo = RISK_LABELS[latest?.risk_profile ?? "moderate"] ?? RISK_LABELS.moderate;

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Investment Recommendations</h1>
        <div className="flex items-center gap-3">
          <select
            className="h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
            value={riskProfile}
            onChange={(e) => setRiskProfile(e.target.value)}
          >
            <option value="conservative">Conservative</option>
            <option value="moderate">Moderate</option>
            <option value="aggressive">Aggressive</option>
          </select>
          <Button onClick={handleGenerate} disabled={generating}>
            {generating ? "Generating…" : "Generate New"}
          </Button>
        </div>
      </div>

      {!latest ? (
        <EmptyState message="No recommendations yet. Select a risk profile and click Generate to get started." />
      ) : (
        <div className="space-y-4">
          {/* KPI row */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Card>
              <CardContent className="flex items-center gap-3 py-4">
                <div className="rounded-xl bg-green-500/10 p-2"><Wallet className="h-5 w-5 text-green-500" /></div>
                <div>
                  <p className="text-xs text-muted-foreground">Safe to Invest / month</p>
                  <p className="text-lg font-bold">₹{latest.safe_to_invest.toLocaleString("en-IN")}</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="flex items-center gap-3 py-4">
                <div className="rounded-xl bg-primary/10 p-2"><Shield className="h-5 w-5 text-primary" /></div>
                <div>
                  <p className="text-xs text-muted-foreground">Risk Profile</p>
                  <p className={`text-lg font-bold ${riskInfo.color}`}>{riskInfo.label}</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="flex items-center gap-3 py-4">
                <div className="rounded-xl bg-purple-500/10 p-2"><PieIcon className="h-5 w-5 text-purple-500" /></div>
                <div>
                  <p className="text-xs text-muted-foreground">Buckets</p>
                  <p className="text-lg font-bold">{latest.buckets.length} allocations</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Inputs snapshot */}
          {latest.inputs_snapshot && Object.keys(latest.inputs_snapshot).length > 0 && (
            <Card>
              <CardContent className="py-3">
                <p className="text-xs text-muted-foreground">
                  Based on: Income ₹{(latest.inputs_snapshot.monthly_income ?? 0).toLocaleString("en-IN")}/mo • 
                  Expenses ₹{(latest.inputs_snapshot.monthly_expense ?? 0).toLocaleString("en-IN")}/mo •
                  Emergency gap ₹{(latest.inputs_snapshot.emergency_gap ?? 0).toLocaleString("en-IN")}
                </p>
              </CardContent>
            </Card>
          )}

          {/* Donut Chart + Bucket Details */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader><CardTitle className="text-base">Allocation Breakdown</CardTitle></CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={latest.buckets.map(b => ({ name: b.name, value: b.allocation_pct }))}
                      cx="50%"
                      cy="50%"
                      innerRadius={65}
                      outerRadius={110}
                      paddingAngle={3}
                      dataKey="value"
                    >
                      {latest.buckets.map((_, i) => (
                        <Cell key={i} fill={COLORS[i % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value: number) => `${value}%`} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle className="text-base">Investment Buckets</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                {latest.buckets.map((b, i) => (
                  <div key={b.name} className="space-y-1">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="h-3 w-3 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                        <span className="font-medium text-sm">{b.name}</span>
                      </div>
                      <div className="text-right">
                        <span className="font-bold text-sm">{b.allocation_pct}%</span>
                        <span className="ml-2 text-xs text-muted-foreground">
                          (₹{(b.allocation_amount ?? 0).toLocaleString("en-IN")}/mo)
                        </span>
                      </div>
                    </div>
                    <div className="h-2 w-full rounded-full bg-muted">
                      <div
                        className="h-full rounded-full transition-all"
                        style={{ width: `${b.allocation_pct}%`, backgroundColor: COLORS[i % COLORS.length] }}
                      />
                    </div>
                    <p className="text-xs text-muted-foreground">{b.rationale}</p>
                    {b.instruments && b.instruments.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-1">
                        {b.instruments.map((inst) => (
                          <Badge key={inst} className="text-[10px] py-0">{inst}</Badge>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          {/* History */}
          {recs.length > 1 && (
            <div>
              <h2 className="mb-2 text-lg font-semibold">History</h2>
              <div className="space-y-2">
                {recs.slice(1).map((r) => (
                  <Card key={r.id}>
                    <CardContent className="flex items-center justify-between py-3">
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-muted-foreground">{r.created_at ? new Date(r.created_at).toLocaleDateString() : "—"}</span>
                        <Badge>{r.risk_profile ?? "moderate"}</Badge>
                      </div>
                      <span className="font-medium">₹{r.safe_to_invest.toLocaleString("en-IN")}/mo</span>
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
