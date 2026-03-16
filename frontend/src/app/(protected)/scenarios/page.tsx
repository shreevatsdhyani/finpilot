"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge, EmptyState, ErrorState, LoadingState } from "@/components/ui/shared";
import { activateScenario, compareScenarios, createScenario, listScenarios } from "@/lib/api";
import type { Scenario, ScenarioCompare } from "@/types/api";
import { useEffect, useState } from "react";

export default function ScenariosPage() {
  const [scenarios, setScenarios] = useState<Scenario[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [name, setName] = useState("");
  const [incPct, setIncPct] = useState("");
  const [expPct, setExpPct] = useState("");
  const [adding, setAdding] = useState(false);
  const [comparison, setComparison] = useState<ScenarioCompare | null>(null);

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
            {scenarios.map((s) => (
              <Card key={s.id} className={s.active ? "border-primary" : ""}>
                <CardContent className="flex items-center justify-between py-4">
                  <div>
                    <span className="font-medium">{s.name}</span>
                    {s.active && <Badge className="ml-2 bg-primary/10 text-primary border-primary/30">Active</Badge>}
                    {s.result && (
                      <p className="text-sm text-muted-foreground mt-1">
                        Net: ₹{(s.result as Record<string, number>).monthly_net?.toLocaleString() ?? "—"}/mo
                      </p>
                    )}
                  </div>
                  {!s.active && (
                    <Button variant="outline" size="sm" onClick={() => handleActivate(s.id)}>Activate</Button>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </>
      )}

      {/* Comparison */}
      {comparison && (
        <Card className="mt-6">
          <CardHeader><CardTitle className="text-base">Scenario Comparison</CardTitle></CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
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
                    const r = s.result as Record<string, unknown> | null;
                    return (
                      <tr key={s.id} className="border-b">
                        <td className="py-2">{s.name}</td>
                        <td className="py-2 text-right">₹{((r?.monthly_net as number) ?? 0).toLocaleString()}</td>
                        <td className="py-2 text-right">₹{((r?.projected_savings as number) ?? 0).toLocaleString()}</td>
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
