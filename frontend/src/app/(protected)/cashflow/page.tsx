"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge, EmptyState, ErrorState, LoadingState } from "@/components/ui/shared";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useReadiness } from "@/context/readiness-context";
import { createExpense, createGoal, generateForecast, listExpenses, listGoals } from "@/lib/api";
import type { Expense, Forecast, Goal } from "@/types/api";
import { AlertTriangle, TrendingUp, TrendingDown, DollarSign } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
  PieChart, Pie, Cell, BarChart, Bar,
} from "recharts";

const COLORS = ["#6366f1", "#f43f5e", "#10b981", "#f59e0b", "#8b5cf6", "#06b6d4", "#ec4899", "#84cc16"];

export default function CashFlowPage() {
  const searchParams = useSearchParams();
  const { flags } = useReadiness();
  const initialTab = searchParams.get("tab") === "expenses" || searchParams.get("tab") === "goals" ? searchParams.get("tab")! : "forecast";

  return (
    <div className="space-y-4">
      <h1 className="mb-6 text-2xl font-bold">Cash Flow</h1>
      {flags.incomeExists && !flags.incomeVerified ? (
        <div className="flex items-center gap-2 rounded-[1.25rem] border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-700 dark:text-amber-300">
          <AlertTriangle className="h-4 w-4" />
          Income not verified yet — forecasts may be less accurate.
        </div>
      ) : null}
      <Tabs defaultValue={initialTab}>
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

/* ---- Forecast Tab with Chart ---- */
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

  const summaryCards = useMemo(() => {
    if (!forecast) return null;
    const months = forecast.months;
    const avgNet = months.reduce((s, m) => s + m.net, 0) / months.length;
    const totalSaved = months[months.length - 1]?.cumulative_savings ?? 0;
    const riskCount = months.filter(m => m.risk).length;
    return { avgNet, totalSaved, riskCount };
  }, [forecast]);

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

      {/* Summary KPIs */}
      {summaryCards && (
        <div className="grid grid-cols-3 gap-4">
          <Card>
            <CardContent className="flex items-center gap-3 py-4">
              <div className="rounded-xl bg-blue-500/10 p-2"><TrendingUp className="h-5 w-5 text-blue-500" /></div>
              <div>
                <p className="text-xs text-muted-foreground">Avg Monthly Net</p>
                <p className="text-lg font-bold">₹{summaryCards.avgNet.toLocaleString("en-IN", { maximumFractionDigits: 0 })}</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center gap-3 py-4">
              <div className="rounded-xl bg-green-500/10 p-2"><DollarSign className="h-5 w-5 text-green-500" /></div>
              <div>
                <p className="text-xs text-muted-foreground">Total Saved</p>
                <p className="text-lg font-bold">₹{summaryCards.totalSaved.toLocaleString("en-IN", { maximumFractionDigits: 0 })}</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center gap-3 py-4">
              <div className={`rounded-xl p-2 ${summaryCards.riskCount > 0 ? "bg-red-500/10" : "bg-green-500/10"}`}>
                <TrendingDown className={`h-5 w-5 ${summaryCards.riskCount > 0 ? "text-red-500" : "text-green-500"}`} />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Risk Months</p>
                <p className="text-lg font-bold">{summaryCards.riskCount} / {forecast?.months.length}</p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Area Chart */}
      {forecast && (
        <Card>
          <CardHeader><CardTitle className="text-base">Income vs Expenses Projection</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={320}>
              <AreaChart data={forecast.months} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="incomeGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="expenseGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#f43f5e" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}K`} />
                <Tooltip
                  formatter={(value: number) => `₹${value.toLocaleString("en-IN")}`}
                  contentStyle={{ borderRadius: "12px", border: "1px solid var(--border)" }}
                />
                <Legend />
                <Area type="monotone" dataKey="projected_income" name="Income" stroke="#10b981" fill="url(#incomeGrad)" strokeWidth={2} />
                <Area type="monotone" dataKey="projected_expenses" name="Expenses" stroke="#f43f5e" fill="url(#expenseGrad)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Cumulative Savings Chart */}
      {forecast && (
        <Card>
          <CardHeader><CardTitle className="text-base">Cumulative Savings Trajectory</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={forecast.months}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}K`} />
                <Tooltip
                  formatter={(value: number) => `₹${value.toLocaleString("en-IN")}`}
                  contentStyle={{ borderRadius: "12px", border: "1px solid var(--border)" }}
                />
                <Bar dataKey="cumulative_savings" name="Cumulative Savings" fill="#6366f1" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Month table */}
      {forecast && (
        <div className="space-y-2">
          {forecast.months.map((m) => (
            <Card key={m.month} className={m.risk ? "border-red-300 bg-red-50 dark:bg-red-950/20" : ""}>
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

/* ---- Expenses Tab with Donut Chart ---- */
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

  const pieData = useMemo(() => {
    const groups = new Map<string, number>();
    for (const exp of expenses) {
      groups.set(exp.category, (groups.get(exp.category) ?? 0) + exp.amount);
    }
    return Array.from(groups.entries()).map(([name, value]) => ({ name, value }));
  }, [expenses]);

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

      {/* Pie chart breakdown */}
      {pieData.length > 0 && (
        <Card>
          <CardHeader><CardTitle className="text-base">Expense Breakdown by Category</CardTitle></CardHeader>
          <CardContent className="flex flex-col sm:flex-row items-center gap-6">
            <ResponsiveContainer width={260} height={260}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={3}
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                >
                  {pieData.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value: number) => `₹${value.toLocaleString("en-IN")}`} />
              </PieChart>
            </ResponsiveContainer>
            <div className="space-y-2">
              {pieData.map((item, i) => (
                <div key={item.name} className="flex items-center gap-2 text-sm">
                  <div className="h-3 w-3 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                  <span>{item.name}</span>
                  <span className="ml-auto font-medium">₹{item.value.toLocaleString("en-IN")}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

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
