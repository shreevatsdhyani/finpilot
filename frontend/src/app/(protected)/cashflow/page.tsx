"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge, EmptyState, ErrorState, LoadingState } from "@/components/ui/shared";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { createExpense, createGoal, generateForecast, listExpenses, listGoals } from "@/lib/api";
import type { Expense, Forecast, Goal } from "@/types/api";
import { useEffect, useState } from "react";

export default function CashFlowPage() {
  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">Cash Flow</h1>
      <Tabs defaultValue="forecast">
        <TabsList>
          <TabsTrigger value="forecast">Forecast</TabsTrigger>
          <TabsTrigger value="expenses">Expenses</TabsTrigger>
          <TabsTrigger value="goals">Goals</TabsTrigger>
        </TabsList>
        <TabsContent value="forecast"><ForecastTab /></TabsContent>
        <TabsContent value="expenses"><ExpensesTab /></TabsContent>
        <TabsContent value="goals"><GoalsTab /></TabsContent>
      </Tabs>
    </div>
  );
}

/* ---- Forecast Tab ---- */
function ForecastTab() {
  const [forecast, setForecast] = useState<Forecast | null>(null);
  const [horizon, setHorizon] = useState(6);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function generate() {
    setLoading(true);
    setError("");
    try {
      const f = await generateForecast(horizon);
      setForecast(f);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mt-4 space-y-4">
      <div className="flex items-end gap-4">
        <div className="space-y-1">
          <Label>Horizon (months)</Label>
          <select
            className="flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
            value={horizon}
            onChange={(e) => setHorizon(Number(e.target.value))}
          >
            <option value={3}>3 months</option>
            <option value={6}>6 months</option>
            <option value={12}>12 months</option>
          </select>
        </div>
        <Button onClick={generate} disabled={loading}>{loading ? "Generating…" : "Generate Forecast"}</Button>
      </div>
      {error && <ErrorState message={error} />}
      {forecast && (
        <div className="space-y-2">
          {forecast.months.map((m) => (
            <Card key={m.month} className={m.risk ? "border-red-300 bg-red-50" : ""}>
              <CardContent className="flex items-center justify-between py-3">
                <span className="font-medium">{m.month}</span>
                <span className="text-green-600">+₹{m.projected_income.toLocaleString()}</span>
                <span className="text-red-500">-₹{m.projected_expenses.toLocaleString()}</span>
                <span className={m.risk ? "font-bold text-red-600" : "text-blue-600"}>
                  Net: ₹{m.net.toLocaleString()}
                </span>
                {m.risk && <Badge className="bg-red-100 text-red-700 border-red-300">RISK</Badge>}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

/* ---- Expenses Tab ---- */
function ExpensesTab() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [category, setCategory] = useState("");
  const [amount, setAmount] = useState("");
  const [desc, setDesc] = useState("");
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    listExpenses().then(setExpenses).catch((e) => setError(e.message)).finally(() => setLoading(false));
  }, []);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!category || !amount) return;
    setAdding(true);
    try {
      const exp = await createExpense({ category, amount: parseFloat(amount), description: desc });
      setExpenses((p) => [exp, ...p]);
      setCategory("");
      setAmount("");
      setDesc("");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed");
    } finally {
      setAdding(false);
    }
  }

  if (loading) return <LoadingState />;
  if (error) return <ErrorState message={error} />;

  return (
    <div className="mt-4 space-y-4">
      <Card>
        <CardHeader><CardTitle className="text-base">Add Expense</CardTitle></CardHeader>
        <CardContent>
          <form onSubmit={handleAdd} className="flex flex-wrap gap-3">
            <Input placeholder="Category" value={category} onChange={(e) => setCategory(e.target.value)} className="w-36" required />
            <Input placeholder="Amount" type="number" value={amount} onChange={(e) => setAmount(e.target.value)} className="w-28" required />
            <Input placeholder="Description" value={desc} onChange={(e) => setDesc(e.target.value)} className="w-48" />
            <Button type="submit" disabled={adding}>{adding ? "Adding…" : "Add"}</Button>
          </form>
        </CardContent>
      </Card>
      {expenses.length === 0 ? (
        <EmptyState message="No expenses recorded yet." />
      ) : (
        <div className="space-y-2">
          {expenses.map((exp) => (
            <Card key={exp.id}>
              <CardContent className="flex items-center justify-between py-3">
                <div>
                  <span className="font-medium">{exp.category}</span>
                  {exp.description && <span className="ml-2 text-sm text-muted-foreground">— {exp.description}</span>}
                </div>
                <span className="font-semibold text-red-500">₹{exp.amount.toLocaleString()}</span>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

/* ---- Goals Tab ---- */
function GoalsTab() {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [title, setTitle] = useState("");
  const [target, setTarget] = useState("");
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    listGoals().then(setGoals).catch((e) => setError(e.message)).finally(() => setLoading(false));
  }, []);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!title || !target) return;
    setAdding(true);
    try {
      const g = await createGoal({ title, target_amount: parseFloat(target) });
      setGoals((p) => [g, ...p]);
      setTitle("");
      setTarget("");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed");
    } finally {
      setAdding(false);
    }
  }

  if (loading) return <LoadingState />;
  if (error) return <ErrorState message={error} />;

  return (
    <div className="mt-4 space-y-4">
      <Card>
        <CardHeader><CardTitle className="text-base">Add Goal</CardTitle></CardHeader>
        <CardContent>
          <form onSubmit={handleAdd} className="flex flex-wrap gap-3">
            <Input placeholder="Goal title" value={title} onChange={(e) => setTitle(e.target.value)} className="w-48" required />
            <Input placeholder="Target amount" type="number" value={target} onChange={(e) => setTarget(e.target.value)} className="w-36" required />
            <Button type="submit" disabled={adding}>{adding ? "Adding…" : "Add"}</Button>
          </form>
        </CardContent>
      </Card>
      {goals.length === 0 ? (
        <EmptyState message="No goals set yet." />
      ) : (
        <div className="space-y-2">
          {goals.map((g) => (
            <Card key={g.id}>
              <CardContent className="flex items-center justify-between py-3">
                <div>
                  <span className="font-medium">{g.title}</span>
                  <Badge className="ml-2">{g.priority}</Badge>
                </div>
                <span className="font-semibold text-primary">₹{g.target_amount.toLocaleString()}</span>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
