"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge, EmptyState, ErrorState, LoadingState } from "@/components/ui/shared";
import { activateScenario, compareScenarios, createScenario, listScenarios } from "@/lib/api";
import type { Scenario, ScenarioCompare, ScenarioResult } from "@/types/api";
import { useEffect, useState } from "react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
  AreaChart, Area,
} from "recharts";

const COLORS = ["#6366f1", "#f43f5e", "#10b981", "#f59e0b"];

export default function ScenariosPage() {
  const [scenarios, setScenarios] = useState<Scenario[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [name, setName] = useState("");
  const [incPct, setIncPct] = useState("");
  const [expPct, setExpPct] = useState("");
  const [adding, setAdding] = useState(false);
  const [comparison, setComparison] = useState<ScenarioCompare | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    listScenarios().then(setScenarios).catch((e) => setError(e.message)).finally(() => setLoading(false));
  }, []);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    setAdding(true);
    try {
      const s = await createScenario({
        name,
        adjustments: {
          income_change_pct: parseFloat(incPct || "0"),
          expense_change_pct: parseFloat(expPct || "0"),
        },
      });
      setScenarios((p) => [s, ...p]);
      setName("");
      setIncPct("");
      setExpPct("");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed");
    } finally {
      setAdding(false);
    }
  }

  async function handleActivate(id: string) {
    try {
      await activateScenario(id);
      setScenarios((p) => p.map((s) => ({ ...s, active: s.id === id })));
    } catch {}
  }

  async function handleCompare() {
    const ids = scenarios.map((s) => s.id);
    if (ids.length < 2) return;
    try {
      const c = await compareScenarios(ids);
      setComparison(c);
    } catch {}
  }

  if (loading) return <LoadingState />;
  if (error) return <ErrorState message={error} />;

  // Build comparison chart data
  const comparisonChartData = comparison?.scenarios.map((s) => {
    const r = s.result as ScenarioResult | null;
    return {
      name: s.name,
      monthly_net: r?.monthly_net ?? 0,
      projected_savings: r?.projected_savings ?? 0,
    };
  }) ?? [];

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">Scenario Planning</h1>

      {/* Create */}
      <Card className="mb-6">
        <CardHeader><CardTitle className="text-base">New Scenario</CardTitle></CardHeader>
        <CardContent>
          <form onSubmit={handleAdd} className="flex flex-wrap gap-3 items-end">
            <div className="space-y-1">
              <Label>Name</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Raise +10%" required className="w-44" />
            </div>
            <div className="space-y-1">
              <Label>Income Change %</Label>
              <Input value={incPct} onChange={(e) => setIncPct(e.target.value)} placeholder="10" type="number" className="w-28" />
            </div>
            <div className="space-y-1">
              <Label>Expense Change %</Label>
              <Input value={expPct} onChange={(e) => setExpPct(e.target.value)} placeholder="-5" type="number" className="w-28" />
            </div>
            <Button type="submit" disabled={adding}>{adding ? "Creating…" : "Create"}</Button>
          </form>
        </CardContent>
      </Card>

      {/* List */}
      {scenarios.length === 0 ? (
        <EmptyState message="No scenarios created yet." />
      ) : (
        <>
          <div className="mb-4 flex justify-end">
            <Button variant="outline" onClick={handleCompare} disabled={scenarios.length < 2}>Compare All</Button>
          </div>
          <div className="space-y-3">
            {scenarios.map((s) => {
              const result = s.result as ScenarioResult | null;
              const isExpanded = expandedId === s.id;
              return (
                <Card key={s.id} className={s.active ? "border-primary" : ""}>
                  <CardContent className="py-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="font-medium">{s.name}</span>
                        {s.active && <Badge className="ml-2 bg-primary/10 text-primary border-primary/30">Active</Badge>}
                        {result && (
                          <div className="flex gap-4 mt-1 text-sm text-muted-foreground">
                            <span>Net: ₹{result.monthly_net?.toLocaleString("en-IN") ?? "—"}/mo</span>
                            <span>Savings: ₹{result.projected_savings?.toLocaleString("en-IN") ?? "—"}</span>
                            {result.risk_month_count > 0 && (
                              <span className="text-red-500">{result.risk_month_count} risk months</span>
                            )}
                          </div>
                        )}
                      </div>
                      <div className="flex gap-2">
                        {result?.months && result.months.length > 0 && (
                          <Button variant="ghost" size="sm" onClick={() => setExpandedId(isExpanded ? null : s.id)}>
                            {isExpanded ? "Hide" : "Details"}
                          </Button>
                        )}
                        {!s.active && (
                          <Button variant="outline" size="sm" onClick={() => handleActivate(s.id)}>Activate</Button>
                        )}
                      </div>
                    </div>

                    {/* Expanded month-by-month chart */}
                    {isExpanded && result?.months && (
                      <div className="mt-4">
                        <ResponsiveContainer width="100%" height={250}>
                          <AreaChart data={result.months} margin={{ top: 5, right: 20, left: 0, bottom: 0 }}>
                            <defs>
                              <linearGradient id={`savGrad-${s.id}`} x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                                <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                              </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                            <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                            <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}K`} />
                            <Tooltip formatter={(v: number) => `₹${v.toLocaleString("en-IN")}`} contentStyle={{ borderRadius: "12px" }} />
                            <Legend />
                            <Area type="monotone" dataKey="projected_income" name="Income" stroke="#10b981" fill="none" strokeWidth={2} />
                            <Area type="monotone" dataKey="projected_expenses" name="Expenses" stroke="#f43f5e" fill="none" strokeWidth={2} />
                            <Area type="monotone" dataKey="cumulative_savings" name="Cumulative" stroke="#6366f1" fill={`url(#savGrad-${s.id})`} strokeWidth={2} />
                          </AreaChart>
                        </ResponsiveContainer>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </>
      )}

      {/* Comparison Chart */}
      {comparison && comparisonChartData.length > 0 && (
        <Card className="mt-6">
          <CardHeader><CardTitle className="text-base">Scenario Comparison</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={comparisonChartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}K`} />
                <Tooltip formatter={(v: number) => `₹${v.toLocaleString("en-IN")}`} contentStyle={{ borderRadius: "12px" }} />
                <Legend />
                <Bar dataKey="monthly_net" name="Monthly Net" fill="#6366f1" radius={[4, 4, 0, 0]} />
                <Bar dataKey="projected_savings" name="Total Savings" fill="#10b981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>

            {/* Table below chart */}
            <div className="overflow-x-auto mt-4">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="py-2 text-left">Scenario</th>
                    <th className="py-2 text-right">Monthly Net</th>
                    <th className="py-2 text-right">Projected Savings</th>
                    <th className="py-2 text-center">Risk</th>
                  </tr>
                </thead>
                <tbody>
                  {comparison.scenarios.map((s) => {
                    const r = s.result as ScenarioResult | null;
                    return (
                      <tr key={s.id} className="border-b">
                        <td className="py-2">{s.name}</td>
                        <td className="py-2 text-right">₹{(r?.monthly_net ?? 0).toLocaleString("en-IN")}</td>
                        <td className="py-2 text-right">₹{(r?.projected_savings ?? 0).toLocaleString("en-IN")}</td>
                        <td className="py-2 text-center">{r?.risk ? "⚠️" : "✓"}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
