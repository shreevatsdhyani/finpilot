"use client";

import { KpiCard, PanelTitle, TrustList } from "@/components/finance-ui";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge, ErrorState, SectionIntro, Skeleton } from "@/components/ui/shared";
import { useReadiness } from "@/context/readiness-context";
import {
    createExpense,
    createGoal,
    createManualSalary,
    generateForecast,
    generateRecommendations,
    getSettings,
    listAlerts,
    markAlertRead,
    markAllAlertsRead,
} from "@/lib/api";
import { cn } from "@/lib/utils";
import type { AdditionalIncomeSource, Alert } from "@/types/api";
import { ArrowRight, Bell, CheckCircle2, ChevronDown, CircleDashed, FileUp, Goal, IndianRupee, Plus, Sparkles, Trash2, TrendingUp, Wallet } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Bar, BarChart, CartesianGrid, Tooltip as RTooltip, ResponsiveContainer, XAxis, YAxis } from "recharts";
import { toast } from "sonner";

/* ---- Constants for intake forms ---- */

const INCOME_SOURCE_TYPES = [
  { value: "salary", label: "Salaried Employment" },
  { value: "freelance", label: "Freelancing / Consulting" },
  { value: "business", label: "Business Income" },
  { value: "rental", label: "Rental Income" },
  { value: "pension", label: "Pension" },
  { value: "other", label: "Other" },
] as const;

const PAY_FREQUENCIES = [
  { value: "monthly", label: "Monthly" },
  { value: "bi-weekly", label: "Bi-weekly" },
  { value: "weekly", label: "Weekly" },
  { value: "annual", label: "Annual" },
] as const;

const EXPENSE_CATEGORIES = [
  "Housing", "Utilities", "Food & Groceries", "Transportation",
  "Healthcare", "Education", "Insurance", "Debt Payments",
  "Personal Care", "Entertainment", "Household",
  "Family & Dependents", "Travel & Vacation", "Miscellaneous",
] as const;

const EXPENSE_FREQUENCIES = [
  { value: "monthly", label: "Monthly" },
  { value: "quarterly", label: "Quarterly" },
  { value: "semi-annual", label: "Semi-annual" },
  { value: "annual", label: "Annual" },
] as const;

const GOAL_CATEGORIES = [
  { value: "Emergency Fund", label: "🛡️ Emergency Fund", horizon: "Short-term" },
  { value: "Debt Payoff", label: "💳 Debt Payoff", horizon: "Short-term" },
  { value: "Vacation / Travel", label: "✈️ Vacation / Travel", horizon: "Short-term" },
  { value: "Gadget / Purchase", label: "💻 Gadget / Purchase", horizon: "Short-term" },
  { value: "Car Purchase", label: "🚗 Car Purchase", horizon: "Medium-term" },
  { value: "Home Down Payment", label: "🏠 Home Down Payment", horizon: "Medium-term" },
  { value: "Wedding", label: "💍 Wedding", horizon: "Medium-term" },
  { value: "Education", label: "🎓 Education", horizon: "Medium-term" },
  { value: "Child's Education", label: "👶 Child's Education", horizon: "Long-term" },
  { value: "Retirement", label: "🏖️ Retirement", horizon: "Long-term" },
  { value: "Wealth Building", label: "📈 Wealth Building", horizon: "Long-term" },
  { value: "Custom", label: "⭐ Custom Goal", horizon: "Any" },
] as const;

const ADDITIONAL_INCOME_TYPES = [
  { value: "freelance", label: "Freelance / Consulting" },
  { value: "rental", label: "Rental Income" },
  { value: "dividend", label: "Dividend Income" },
  { value: "interest", label: "Interest (FD, Savings)" },
  { value: "other", label: "Other Income" },
] as const;

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(value);
}

function formatDate(value: string | null | undefined) {
  if (!value) return "Awaiting input";
  return new Date(value).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

type ModalState = null | "income" | "expenses" | "goals";

export default function DashboardPage() {
  const searchParams = useSearchParams();
  const setupMode = searchParams.get("setup") === "1";
  const { loading, error, refresh, summary, salaryDocs, expenses, goals, forecasts, recommendations, missingSteps, flags } = useReadiness();

  const [modal, setModal] = useState<ModalState>(null);
  const [submitting, setSubmitting] = useState(false);

  // ── Income form state (comprehensive) ─────────────────────────────
  const [incomeTab, setIncomeTab] = useState("core");
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({ earnings: false, deductions: false });
  const [manualIncome, setManualIncome] = useState({
    net_take_home: "",
    income_source_type: "salary",
    employer_name: "",
    pay_frequency: "monthly",
    ctc_annual: "",
    gross_monthly: "",
    basic: "",
    hra: "",
    da: "",
    special_allowance: "",
    other_allowances: "",
    performance_bonus: "",
    variable_pay: "",
    pf_employee: "",
    professional_tax: "",
    income_tax_tds: "",
    esi_contribution: "",
    other_deductions: "",
  });
  const [additionalIncomes, setAdditionalIncomes] = useState<Array<{ source_type: string; label: string; monthly_amount: string }>>([]);

  // ── Expense form state (comprehensive) ────────────────────────────
  const [expenseForm, setExpenseForm] = useState({
    category: "Housing",
    amount: "",
    frequency: "monthly",
    is_essential: true,
    is_fixed: true,
    description: "",
  });

  // ── Goal form state (comprehensive) ───────────────────────────────
  const [goalForm, setGoalForm] = useState({
    category: "Emergency Fund",
    title: "Emergency Fund",
    target_amount: "",
    current_savings: "",
    monthly_contribution: "",
    deadline: "",
    priority: "high",
    risk_tolerance: "moderate",
    flexibility: "flexible",
    notes: "",
  });

  const toggleSection = useCallback((key: string) => {
    setExpandedSections(prev => ({ ...prev, [key]: !prev[key] }));
  }, []);

  const addAdditionalIncome = useCallback(() => {
    setAdditionalIncomes(prev => [...prev, { source_type: "freelance", label: "", monthly_amount: "" }]);
  }, []);

  const removeAdditionalIncome = useCallback((idx: number) => {
    setAdditionalIncomes(prev => prev.filter((_, i) => i !== idx));
  }, []);

  const updateAdditionalIncome = useCallback((idx: number, field: string, value: string) => {
    setAdditionalIncomes(prev => prev.map((item, i) => i === idx ? { ...item, [field]: value } : item));
  }, []);

  const latestSalary = salaryDocs[0] ?? null;
  const latestForecast = forecasts[0] ?? null;
  const latestPlan = recommendations[0] ?? null;
  const setupComplete = flags.incomeExists && flags.expensesExists && flags.forecastExists;

  const kpis = useMemo(
    () => [
      {
        label: "Monthly income",
        value: formatCurrency(summary?.total_income ?? 0),
        detail: latestSalary ? `Source: ${latestSalary.filename}` : "Add income to start forecasting",
        href: "/salary",
        tone: flags.incomeExists ? "success" : "default",
      },
      {
        label: "Monthly expenses",
        value: formatCurrency(summary?.total_expenses ?? 0),
        detail: expenses.length > 0 ? `${expenses.length} baseline entries mapped` : "Set your monthly baseline",
        tone: flags.expensesExists ? "warning" : "default",
      },
      {
        label: "Net savings",
        value: formatCurrency(summary?.net_savings ?? 0),
        detail: flags.forecastExists ? "Projected from your current setup" : "Forecast unavailable until setup is finished",
        tone: (summary?.net_savings ?? 0) >= 0 ? "success" : "danger",
      },
      {
        label: "Safe to invest",
        value: latestPlan ? formatCurrency(latestPlan.safe_to_invest) : formatCurrency(0),
        detail: latestPlan ? "Explainable allocation plan ready" : "Generate plan after forecast",
        tone: latestPlan ? "success" : "default",
        href: flags.forecastExists && flags.incomeExists && flags.expensesExists ? "/investments" : undefined,
      },
      {
        label: "Active goals",
        value: `${summary?.active_goals ?? 0}`,
        detail: goals.length > 0 ? "Goals connected to planning outputs" : "Recommended to personalize your plan",
        tone: goals.length > 0 ? "success" : "default",
      },
    ],
    [summary, latestSalary, expenses.length, latestPlan, flags, goals.length]
  );

  async function handleManualIncomeSubmit() {
    setSubmitting(true);
    try {
      const numOrUndef = (v: string) => v ? Number(v) : undefined;
      const addlIncomes: AdditionalIncomeSource[] = additionalIncomes
        .filter(a => a.monthly_amount)
        .map(a => ({ source_type: a.source_type, label: a.label, monthly_amount: Number(a.monthly_amount) }));
      await createManualSalary({
        net_take_home: Number(manualIncome.net_take_home),
        income_source_type: manualIncome.income_source_type,
        employer_name: manualIncome.employer_name || undefined,
        pay_frequency: manualIncome.pay_frequency,
        ctc_annual: numOrUndef(manualIncome.ctc_annual),
        gross_monthly: numOrUndef(manualIncome.gross_monthly),
        basic: numOrUndef(manualIncome.basic),
        hra: numOrUndef(manualIncome.hra),
        da: numOrUndef(manualIncome.da),
        special_allowance: numOrUndef(manualIncome.special_allowance),
        other_allowances: numOrUndef(manualIncome.other_allowances),
        performance_bonus: numOrUndef(manualIncome.performance_bonus),
        variable_pay: numOrUndef(manualIncome.variable_pay),
        pf_employee: numOrUndef(manualIncome.pf_employee),
        professional_tax: numOrUndef(manualIncome.professional_tax),
        income_tax_tds: numOrUndef(manualIncome.income_tax_tds),
        esi_contribution: numOrUndef(manualIncome.esi_contribution),
        other_deductions: numOrUndef(manualIncome.other_deductions),
        additional_incomes: addlIncomes.length > 0 ? addlIncomes : undefined,
      });
      toast.success("Income added. Salary-based planning is now available.");
      setModal(null);
      setManualIncome({
        net_take_home: "", income_source_type: "salary", employer_name: "", pay_frequency: "monthly",
        ctc_annual: "", gross_monthly: "", basic: "", hra: "", da: "", special_allowance: "",
        other_allowances: "", performance_bonus: "", variable_pay: "",
        pf_employee: "", professional_tax: "", income_tax_tds: "", esi_contribution: "", other_deductions: "",
      });
      setAdditionalIncomes([]);
      await refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save manual income.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleExpenseSubmit() {
    setSubmitting(true);
    try {
      await createExpense({
        category: expenseForm.category,
        amount: Number(expenseForm.amount),
        frequency: expenseForm.frequency,
        is_essential: expenseForm.is_essential,
        is_fixed: expenseForm.is_fixed,
        description: expenseForm.description,
      });
      toast.success("Expense baseline updated.");
      setModal(null);
      setExpenseForm({ category: "Housing", amount: "", frequency: "monthly", is_essential: true, is_fixed: true, description: "" });
      await refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save expense.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleGoalSubmit() {
    setSubmitting(true);
    try {
      await createGoal({
        category: goalForm.category,
        title: goalForm.title,
        target_amount: Number(goalForm.target_amount),
        current_savings: goalForm.current_savings ? Number(goalForm.current_savings) : undefined,
        monthly_contribution: goalForm.monthly_contribution ? Number(goalForm.monthly_contribution) : undefined,
        deadline: goalForm.deadline || undefined,
        priority: goalForm.priority,
        risk_tolerance: goalForm.risk_tolerance,
        flexibility: goalForm.flexibility,
        notes: goalForm.notes || undefined,
      });
      toast.success("Goal added to your plan.");
      setModal(null);
      setGoalForm({
        category: "Emergency Fund", title: "Emergency Fund", target_amount: "", current_savings: "",
        monthly_contribution: "", deadline: "", priority: "high", risk_tolerance: "moderate",
        flexibility: "flexible", notes: "",
      });
      await refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to create goal.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleGenerateForecast() {
    setSubmitting(true);
    try {
      const userSettings = await getSettings();
      const riskProfile = (userSettings as any).risk_profile || "balanced";
      await generateForecast(6, riskProfile);
      toast.success("6-month forecast generated using your risk profile.");
      await refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to generate forecast.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleGeneratePlan() {
    setSubmitting(true);
    try {
      const userSettings = await getSettings();
      const riskProfile = (userSettings as any).risk_profile || "balanced";
      await generateRecommendations(riskProfile);
      toast.success("Investment plan generated based on your risk profile.");
      await refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to generate plan.");
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-28 w-full" />
        <div className="grid gap-4 xl:grid-cols-5">
          {Array.from({ length: 5 }).map((_, index) => (
            <Skeleton key={index} className="h-40 w-full" />
          ))}
        </div>
        <Skeleton className="h-80 w-full" />
      </div>
    );
  }

  if (error) {
    return <ErrorState message="Couldn’t load setup status" />;
  }

  return (
    <div className="space-y-5">
      <SectionIntro
        eyebrow="Dashboard"
        title="Where you stand, what unlocks next"
        description="Progress through income, expenses, forecast, and plan generation. FinPilot unlocks planning surfaces as your data becomes trustworthy enough to use."
        actions={
          <>
            <Button asChild variant="outline" size="sm">
              <Link href="/salary/upload">Upload salary slip</Link>
            </Button>
            <Button size="sm" onClick={() => setModal("income")}>
              Enter income manually
            </Button>
          </>
        }
      />

      {flags.incomeExists && !flags.incomeVerified ? (
        <Card className="border-amber-500/30 bg-amber-500/10">
          <CardContent className="flex items-center gap-3 py-4 text-sm text-amber-700 dark:text-amber-300">
            <CircleDashed className="h-4 w-4" />
            Income not verified yet. Forecasts may be less accurate until you verify your latest salary entry.
          </CardContent>
        </Card>
      ) : null}

      {!setupComplete || setupMode ? (
        <Card className={cn("border-primary/20 bg-gradient-to-br from-primary/10 via-card to-card", setupMode ? "ring-2 ring-primary/30" : "") }>
          <CardContent className="p-4 sm:p-5">
            <PanelTitle
              badge="Guided unlock"
              title="Finish setup to unlock planning"
              description="Complete each step. Navigation unlocks as your data becomes trustworthy."
            />

            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
              {missingSteps.map((step) => {
                const complete = step.complete;
                return (
                  <div key={step.id} className={cn("rounded-xl border p-3", complete ? "border-emerald-500/25 bg-emerald-500/10" : "border-border/80 bg-card/85") }>
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="text-xs font-semibold text-foreground">{step.title}</p>
                        {step.recommended ? <Badge className="mt-1 text-[9px] border-border/70 bg-secondary/70 text-secondary-foreground">Recommended</Badge> : null}
                      </div>
                      {complete ? <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" /> : <CircleDashed className="h-4 w-4 text-muted-foreground shrink-0" />}
                    </div>
                    <p className="mt-2 text-[11px] leading-5 text-muted-foreground">{step.description}</p>
                    <div className="mt-2">
                      {step.id === "income" ? (
                        <div className="flex flex-col gap-1.5">
                          <Button asChild size="xs" variant="outline">
                            <Link href="/salary/upload">Upload slip</Link>
                          </Button>
                          <Button size="xs" onClick={() => setModal("income")} disabled={complete}>
                            Manual entry
                          </Button>
                        </div>
                      ) : null}
                      {step.id === "expenses" ? (
                        <Button size="xs" onClick={() => setModal("expenses")} disabled={complete}>
                          Add expenses
                        </Button>
                      ) : null}
                      {step.id === "goals" ? (
                        <Button size="xs" variant="outline" onClick={() => setModal("goals")}>
                          Add goal
                        </Button>
                      ) : null}
                      {step.id === "forecast" ? (
                        <Button size="xs" onClick={() => void handleGenerateForecast()} disabled={complete || submitting || !flags.incomeExists || !flags.expensesExists}>
                          Generate forecast
                        </Button>
                      ) : null}
                      {step.id === "plan" ? (
                        <Button size="xs" onClick={() => void handleGeneratePlan()} disabled={complete || submitting || !flags.forecastExists || !flags.incomeExists || !flags.expensesExists}>
                          Generate plan
                        </Button>
                      ) : null}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      ) : null}

      <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-5">
        {kpis.map((card) => (
          <KpiCard key={card.label} label={card.label} value={card.value} detail={card.detail} href={card.href} tone={card.tone as "default" | "success" | "warning" | "danger"} />
        ))}
      </div>

      {/* ---- Mini Chart + Alerts ---- */}
      {flags.incomeExists && flags.expensesExists && (
        <div className="grid gap-6 xl:grid-cols-2">
          <Card>
            <CardContent className="p-6">
              <PanelTitle badge="Overview" title="Income vs Expenses" description="Monthly summary" />
              <ResponsiveContainer width="100%" height={180}>
                <BarChart
                  data={[
                    { name: "Income", value: summary?.total_income ?? 0 },
                    { name: "Expenses", value: summary?.total_expenses ?? 0 },
                    { name: "Savings", value: summary?.net_savings ?? 0 },
                  ]}
                  margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                  <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 11 }} tickFormatter={(v: number) => `₹${(v / 1000).toFixed(0)}K`} />
                  <RTooltip formatter={(v) => `₹${Number(v).toLocaleString("en-IN")}`} contentStyle={{ borderRadius: "12px" }} />
                  <Bar dataKey="value" fill="#6366f1" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
          <AlertsPanel />
        </div>
      )}

      <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <Card>
          <CardContent className="p-6 sm:p-7">
            <PanelTitle
              badge="Next best action"
              title={
                !flags.incomeExists
                  ? "Connect your income source"
                  : !flags.expensesExists
                    ? "Build your monthly baseline"
                    : !flags.forecastExists
                      ? "Generate your first forecast"
                      : !flags.planExists
                        ? "Create your first investment plan"
                        : "Planning surfaces are fully unlocked"
              }
              description={
                !flags.incomeExists
                  ? "Upload a verified payslip or enter income manually so every downstream estimate has a trustworthy base."
                  : !flags.expensesExists
                    ? "Map monthly spending to unlock cashflow and safe-to-invest estimates."
                    : !flags.forecastExists
                      ? "Forecasting reveals risk months and unlocks scenarios."
                      : !flags.planExists
                        ? "Turn your forecast into an explainable allocation plan."
                        : "You can now move between cashflow, scenarios, and investments without setup gates."
              }
              action={
                !flags.incomeExists ? (
                  <Button asChild>
                    <Link href="/salary/upload">Upload salary slip</Link>
                  </Button>
                ) : !flags.expensesExists ? (
                  <Button onClick={() => setModal("expenses")}>
                    Add expenses
                  </Button>
                ) : !flags.forecastExists ? (
                  <Button onClick={() => void handleGenerateForecast()} disabled={submitting}>
                    Generate forecast
                  </Button>
                ) : !flags.planExists ? (
                  <Button onClick={() => void handleGeneratePlan()} disabled={submitting}>
                    Generate plan
                  </Button>
                ) : (
                  <Button asChild>
                    <Link href="/investments">Open investments</Link>
                  </Button>
                )
              }
            />

            <div className="grid gap-4 md:grid-cols-3">
              <div className="rounded-[1.25rem] border border-border/70 bg-muted/30 p-4">
                <FileUp className="h-5 w-5 text-primary" />
                <p className="mt-3 text-sm font-semibold">Income input</p>
                <p className="mt-1 text-sm text-muted-foreground">{latestSalary ? latestSalary.filename : "No salary source connected yet"}</p>
              </div>
              <div className="rounded-[1.25rem] border border-border/70 bg-muted/30 p-4">
                <Wallet className="h-5 w-5 text-primary" />
                <p className="mt-3 text-sm font-semibold">Cashflow baseline</p>
                <p className="mt-1 text-sm text-muted-foreground">{expenses.length > 0 ? `${expenses.length} expense lines mapped` : "Expenses missing"}</p>
              </div>
              <div className="rounded-[1.25rem] border border-border/70 bg-muted/30 p-4">
                <TrendingUp className="h-5 w-5 text-primary" />
                <p className="mt-3 text-sm font-semibold">Forecast status</p>
                <p className="mt-1 text-sm text-muted-foreground">{latestForecast ? `Ready for ${latestForecast.horizon} months` : "Forecast not generated"}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6 sm:p-7">
            <PanelTitle
              badge="Trust signals"
              title="What your current outputs are based on"
              description="FinPilot should always explain where numbers come from and how fresh they are."
            />
            <TrustList
              items={[
                { label: "Salary updated", value: formatDate(latestSalary?.created_at) },
                { label: "Expenses updated", value: expenses[0]?.date ? formatDate(expenses[0].date) : "Awaiting baseline" },
                { label: "Forecast generated", value: formatDate(latestForecast?.created_at) },
                { label: "Plan generated", value: formatDate(latestPlan?.created_at) },
              ]}
            />

            <div className="mt-5 rounded-[1.25rem] border border-border/70 bg-muted/30 p-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-2 font-semibold text-foreground">
                <Sparkles className="h-4 w-4 text-primary" />
                Planning confidence
              </div>
              <p className="mt-2 leading-6">
                {flags.incomeVerified && flags.expensesExists
                  ? "Good confidence. Core inputs are present and suitable for cashflow planning."
                  : "Limited confidence. Add verified income and expense inputs before acting on projections."}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ════════════════════════════════════════════════════════════════
          INCOME DIALOG — Comprehensive Indian Payroll Structure
         ════════════════════════════════════════════════════════════════ */}
      <Dialog open={modal === "income"} onOpenChange={(open) => setModal(open ? "income" : null)}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Enter income manually</DialogTitle>
            <DialogDescription>
              Only <strong>net take-home</strong> is required. The more detail you provide, the more accurate your forecasts and investment plans will be.
            </DialogDescription>
          </DialogHeader>

          {/* ── Core Fields ── */}
          <div className="space-y-4">
            <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 space-y-4">
              <p className="text-xs font-semibold uppercase tracking-wider text-primary">Core — Required</p>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="inc-net">Net take-home (₹/month) *</Label>
                  <Input id="inc-net" type="number" value={manualIncome.net_take_home} onChange={(e) => setManualIncome(p => ({ ...p, net_take_home: e.target.value }))} placeholder="73,000" className="text-lg font-semibold" />
                  <p className="text-[11px] text-muted-foreground">The amount deposited to your bank account after all deductions.</p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="inc-source-type">Income source</Label>
                  <select id="inc-source-type" className="flex h-11 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm" value={manualIncome.income_source_type} onChange={(e) => setManualIncome(p => ({ ...p, income_source_type: e.target.value }))}>
                    {INCOME_SOURCE_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                  </select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="inc-freq">Pay frequency</Label>
                  <select id="inc-freq" className="flex h-11 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm" value={manualIncome.pay_frequency} onChange={(e) => setManualIncome(p => ({ ...p, pay_frequency: e.target.value }))}>
                    {PAY_FREQUENCIES.map(f => <option key={f.value} value={f.value}>{f.label}</option>)}
                  </select>
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="inc-employer">Employer / Source name</Label>
                  <Input id="inc-employer" value={manualIncome.employer_name} onChange={(e) => setManualIncome(p => ({ ...p, employer_name: e.target.value }))} placeholder="Acme Corp" />
                </div>
              </div>
            </div>

            {/* ── Earnings Breakdown (collapsible) ── */}
            <div className="rounded-xl border border-border/70 overflow-hidden">
              <button type="button" className="flex w-full items-center justify-between p-4 text-left hover:bg-muted/30 transition" onClick={() => toggleSection("earnings")}>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Earnings Breakdown</p>
                  <p className="text-[11px] text-muted-foreground mt-0.5">CTC, gross, basic, HRA, DA, allowances, bonus, variable pay</p>
                </div>
                <ChevronDown className={cn("h-4 w-4 text-muted-foreground transition-transform", expandedSections.earnings && "rotate-180")} />
              </button>
              {expandedSections.earnings && (
                <div className="border-t border-border/50 p-4 grid gap-4 sm:grid-cols-3">
                  <div className="space-y-2">
                    <Label htmlFor="inc-ctc">CTC (Annual)</Label>
                    <Input id="inc-ctc" type="number" value={manualIncome.ctc_annual} onChange={(e) => setManualIncome(p => ({ ...p, ctc_annual: e.target.value }))} placeholder="12,00,000" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="inc-gross">Gross monthly</Label>
                    <Input id="inc-gross" type="number" value={manualIncome.gross_monthly} onChange={(e) => setManualIncome(p => ({ ...p, gross_monthly: e.target.value }))} placeholder="85,000" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="inc-basic">Basic salary</Label>
                    <Input id="inc-basic" type="number" value={manualIncome.basic} onChange={(e) => setManualIncome(p => ({ ...p, basic: e.target.value }))} placeholder="42,500" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="inc-hra">HRA</Label>
                    <Input id="inc-hra" type="number" value={manualIncome.hra} onChange={(e) => setManualIncome(p => ({ ...p, hra: e.target.value }))} placeholder="17,000" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="inc-da">DA (Dearness Allowance)</Label>
                    <Input id="inc-da" type="number" value={manualIncome.da} onChange={(e) => setManualIncome(p => ({ ...p, da: e.target.value }))} placeholder="0" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="inc-special">Special allowance</Label>
                    <Input id="inc-special" type="number" value={manualIncome.special_allowance} onChange={(e) => setManualIncome(p => ({ ...p, special_allowance: e.target.value }))} placeholder="12,500" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="inc-other-allow">Other allowances</Label>
                    <Input id="inc-other-allow" type="number" value={manualIncome.other_allowances} onChange={(e) => setManualIncome(p => ({ ...p, other_allowances: e.target.value }))} placeholder="3,000" />
                    <p className="text-[10px] text-muted-foreground">Conveyance, medical, LTA combined</p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="inc-bonus">Performance bonus</Label>
                    <Input id="inc-bonus" type="number" value={manualIncome.performance_bonus} onChange={(e) => setManualIncome(p => ({ ...p, performance_bonus: e.target.value }))} placeholder="5,000" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="inc-variable">Variable pay / Commission</Label>
                    <Input id="inc-variable" type="number" value={manualIncome.variable_pay} onChange={(e) => setManualIncome(p => ({ ...p, variable_pay: e.target.value }))} placeholder="0" />
                  </div>
                </div>
              )}
            </div>

            {/* ── Deductions (collapsible) ── */}
            <div className="rounded-xl border border-border/70 overflow-hidden">
              <button type="button" className="flex w-full items-center justify-between p-4 text-left hover:bg-muted/30 transition" onClick={() => toggleSection("deductions")}>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Statutory Deductions</p>
                  <p className="text-[11px] text-muted-foreground mt-0.5">PF, professional tax, TDS, ESI, other deductions</p>
                </div>
                <ChevronDown className={cn("h-4 w-4 text-muted-foreground transition-transform", expandedSections.deductions && "rotate-180")} />
              </button>
              {expandedSections.deductions && (
                <div className="border-t border-border/50 p-4 grid gap-4 sm:grid-cols-3">
                  <div className="space-y-2">
                    <Label htmlFor="inc-pf">PF (Employee)</Label>
                    <Input id="inc-pf" type="number" value={manualIncome.pf_employee} onChange={(e) => setManualIncome(p => ({ ...p, pf_employee: e.target.value }))} placeholder="5,100" />
                    <p className="text-[10px] text-muted-foreground">Usually 12% of Basic + DA</p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="inc-ptax">Professional tax</Label>
                    <Input id="inc-ptax" type="number" value={manualIncome.professional_tax} onChange={(e) => setManualIncome(p => ({ ...p, professional_tax: e.target.value }))} placeholder="200" />
                    <p className="text-[10px] text-muted-foreground">State-level, max ₹2,500/yr</p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="inc-tds">Income tax (TDS)</Label>
                    <Input id="inc-tds" type="number" value={manualIncome.income_tax_tds} onChange={(e) => setManualIncome(p => ({ ...p, income_tax_tds: e.target.value }))} placeholder="6,000" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="inc-esi">ESI contribution</Label>
                    <Input id="inc-esi" type="number" value={manualIncome.esi_contribution} onChange={(e) => setManualIncome(p => ({ ...p, esi_contribution: e.target.value }))} placeholder="0" />
                    <p className="text-[10px] text-muted-foreground">Applicable if gross ≤ ₹21,000</p>
                  </div>
                  <div className="space-y-2 sm:col-span-2">
                    <Label htmlFor="inc-other-ded">Other deductions</Label>
                    <Input id="inc-other-ded" type="number" value={manualIncome.other_deductions} onChange={(e) => setManualIncome(p => ({ ...p, other_deductions: e.target.value }))} placeholder="0" />
                  </div>
                </div>
              )}
            </div>

            {/* ── Additional Income Sources (dynamic) ── */}
            <div className="rounded-xl border border-border/70 p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Additional Income Sources</p>
                  <p className="text-[11px] text-muted-foreground mt-0.5">Freelance, rental, dividends, interest, etc.</p>
                </div>
                <Button type="button" size="xs" variant="outline" onClick={addAdditionalIncome}>
                  <Plus className="mr-1 h-3 w-3" /> Add source
                </Button>
              </div>
              {additionalIncomes.length === 0 && (
                <p className="text-[11px] text-muted-foreground italic">No additional sources added yet.</p>
              )}
              {additionalIncomes.map((inc, idx) => (
                <div key={idx} className="grid gap-3 sm:grid-cols-[1fr_1.5fr_1fr_auto] items-end rounded-lg bg-muted/30 p-3">
                  <div className="space-y-1">
                    <Label className="text-[11px]">Type</Label>
                    <select className="flex h-9 w-full rounded-lg border border-input bg-background px-2 py-1 text-xs" value={inc.source_type} onChange={(e) => updateAdditionalIncome(idx, "source_type", e.target.value)}>
                      {ADDITIONAL_INCOME_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                    </select>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[11px]">Label</Label>
                    <Input className="h-9 text-xs" value={inc.label} onChange={(e) => updateAdditionalIncome(idx, "label", e.target.value)} placeholder="e.g. Upwork freelancing" />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[11px]">Monthly ₹</Label>
                    <Input className="h-9 text-xs" type="number" value={inc.monthly_amount} onChange={(e) => updateAdditionalIncome(idx, "monthly_amount", e.target.value)} placeholder="15,000" />
                  </div>
                  <Button type="button" size="xs" variant="ghost" className="text-destructive hover:text-destructive" onClick={() => removeAdditionalIncome(idx)}>
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              ))}
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setModal(null)}>Cancel</Button>
            <Button onClick={() => void handleManualIncomeSubmit()} disabled={submitting || !manualIncome.net_take_home}>
              <IndianRupee className="mr-2 h-4 w-4" />
              Save income
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ════════════════════════════════════════════════════════════════
          EXPENSES DIALOG — 14 India-Standard Categories
         ════════════════════════════════════════════════════════════════ */}
      <Dialog open={modal === "expenses"} onOpenChange={(open) => setModal(open ? "expenses" : null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add expense baseline</DialogTitle>
            <DialogDescription>One expense entry unlocks cashflow. A fuller baseline improves planning quality. Add each category separately for best results.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="exp-category">Category *</Label>
                <select id="exp-category" className="flex h-11 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm" value={expenseForm.category} onChange={(e) => setExpenseForm(p => ({ ...p, category: e.target.value }))}>
                  {EXPENSE_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="exp-amount">Amount (₹) *</Label>
                <Input id="exp-amount" type="number" value={expenseForm.amount} onChange={(e) => setExpenseForm(p => ({ ...p, amount: e.target.value }))} placeholder="25,000" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="exp-freq">Frequency</Label>
                <select id="exp-freq" className="flex h-11 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm" value={expenseForm.frequency} onChange={(e) => setExpenseForm(p => ({ ...p, frequency: e.target.value }))}>
                  {EXPENSE_FREQUENCIES.map(f => <option key={f.value} value={f.value}>{f.label}</option>)}
                </select>
                <p className="text-[10px] text-muted-foreground">Annual expenses get divided by 12 for monthly baseline</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="exp-desc">Description</Label>
                <Input id="exp-desc" value={expenseForm.description} onChange={(e) => setExpenseForm(p => ({ ...p, description: e.target.value }))} placeholder="Monthly rent for apartment" />
              </div>
            </div>

            {/* Toggle switches */}
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="flex items-center justify-between rounded-xl border border-border/70 p-3 cursor-pointer hover:bg-muted/20 transition">
                <div>
                  <p className="text-sm font-medium">Essential expense</p>
                  <p className="text-[11px] text-muted-foreground">Is this a need (not a want)?</p>
                </div>
                <button
                  type="button"
                  role="switch"
                  aria-checked={expenseForm.is_essential}
                  onClick={() => setExpenseForm(p => ({ ...p, is_essential: !p.is_essential }))}
                  className={cn("relative inline-flex h-6 w-11 shrink-0 rounded-full border-2 border-transparent transition-colors", expenseForm.is_essential ? "bg-primary" : "bg-muted")}
                >
                  <span className={cn("pointer-events-none block h-5 w-5 rounded-full bg-white shadow-lg transition-transform", expenseForm.is_essential ? "translate-x-5" : "translate-x-0")} />
                </button>
              </label>
              <label className="flex items-center justify-between rounded-xl border border-border/70 p-3 cursor-pointer hover:bg-muted/20 transition">
                <div>
                  <p className="text-sm font-medium">Fixed amount</p>
                  <p className="text-[11px] text-muted-foreground">Same amount every period?</p>
                </div>
                <button
                  type="button"
                  role="switch"
                  aria-checked={expenseForm.is_fixed}
                  onClick={() => setExpenseForm(p => ({ ...p, is_fixed: !p.is_fixed }))}
                  className={cn("relative inline-flex h-6 w-11 shrink-0 rounded-full border-2 border-transparent transition-colors", expenseForm.is_fixed ? "bg-primary" : "bg-muted")}
                >
                  <span className={cn("pointer-events-none block h-5 w-5 rounded-full bg-white shadow-lg transition-transform", expenseForm.is_fixed ? "translate-x-5" : "translate-x-0")} />
                </button>
              </label>
            </div>

            {expenseForm.amount && (
              <div className="rounded-xl border border-primary/20 bg-primary/5 p-3 text-sm">
                <span className="text-muted-foreground">Monthly equivalent: </span>
                <span className="font-semibold text-foreground">
                  {formatCurrency(
                    Number(expenseForm.amount) / ({ monthly: 1, quarterly: 3, "semi-annual": 6, annual: 12 }[expenseForm.frequency] ?? 1)
                  )}
                </span>
                {expenseForm.frequency !== "monthly" && (
                  <span className="text-muted-foreground"> (from {expenseForm.frequency} amount)</span>
                )}
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setModal(null)}>Cancel</Button>
            <Button onClick={() => void handleExpenseSubmit()} disabled={submitting || !expenseForm.amount}>
              <ArrowRight className="mr-2 h-4 w-4" />
              Save expense
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ════════════════════════════════════════════════════════════════
          GOALS DIALOG — 12 SMART Goal Categories
         ════════════════════════════════════════════════════════════════ */}
      <Dialog open={modal === "goals"} onOpenChange={(open) => setModal(open ? "goals" : null)}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add a financial goal</DialogTitle>
            <DialogDescription>Goals aren't required to unlock planning, but they make recommendations personal. The more detail, the better your plan.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {/* Goal category selector */}
            <div className="space-y-2">
              <Label>Goal type</Label>
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                {GOAL_CATEGORIES.map(gc => (
                  <button
                    key={gc.value}
                    type="button"
                    onClick={() => setGoalForm(p => ({ ...p, category: gc.value, title: gc.value === "Custom" ? "" : gc.value }))}
                    className={cn(
                      "rounded-xl border p-2 text-left text-xs transition hover:border-primary/40",
                      goalForm.category === gc.value ? "border-primary bg-primary/10 text-primary" : "border-border/70 text-muted-foreground"
                    )}
                  >
                    <span className="block text-sm">{gc.label.split(" ")[0]}</span>
                    <span className="block mt-0.5 text-[10px] truncate">{gc.label.split(" ").slice(1).join(" ")}</span>
                  </button>
                ))}
              </div>
              <p className="text-[10px] text-muted-foreground">
                Horizon: {GOAL_CATEGORIES.find(gc => gc.value === goalForm.category)?.horizon ?? "Any"}
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="goal-title">Goal title *</Label>
                <Input id="goal-title" value={goalForm.title} onChange={(e) => setGoalForm(p => ({ ...p, title: e.target.value }))} placeholder="e.g. Buy a car in 2 years" />
              </div>

              <div className="space-y-2">
                <Label htmlFor="goal-target">Target amount (₹) *</Label>
                <Input id="goal-target" type="number" value={goalForm.target_amount} onChange={(e) => setGoalForm(p => ({ ...p, target_amount: e.target.value }))} placeholder="5,00,000" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="goal-current">Already saved (₹)</Label>
                <Input id="goal-current" type="number" value={goalForm.current_savings} onChange={(e) => setGoalForm(p => ({ ...p, current_savings: e.target.value }))} placeholder="50,000" />
              </div>

              <div className="space-y-2">
                <Label htmlFor="goal-monthly">Monthly contribution (₹)</Label>
                <Input id="goal-monthly" type="number" value={goalForm.monthly_contribution} onChange={(e) => setGoalForm(p => ({ ...p, monthly_contribution: e.target.value }))} placeholder="10,000" />
                <p className="text-[10px] text-muted-foreground">How much you plan to save monthly toward this goal</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="goal-deadline">Target date</Label>
                <Input id="goal-deadline" type="date" value={goalForm.deadline} onChange={(e) => setGoalForm(p => ({ ...p, deadline: e.target.value }))} />
              </div>

              <div className="space-y-2">
                <Label htmlFor="goal-priority">Priority</Label>
                <select id="goal-priority" className="flex h-11 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm" value={goalForm.priority} onChange={(e) => setGoalForm(p => ({ ...p, priority: e.target.value }))}>
                  <option value="critical">🔴 Critical — Must achieve</option>
                  <option value="high">🟠 High — Very important</option>
                  <option value="medium">🟡 Medium — Important</option>
                  <option value="low">🟢 Low — Nice to have</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="goal-risk">Risk tolerance for this goal</Label>
                <select id="goal-risk" className="flex h-11 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm" value={goalForm.risk_tolerance} onChange={(e) => setGoalForm(p => ({ ...p, risk_tolerance: e.target.value }))}>
                  <option value="conservative">Conservative — FDs, liquid funds</option>
                  <option value="moderate">Moderate — Balanced mutual funds</option>
                  <option value="aggressive">Aggressive — Equity, ELSS, index funds</option>
                </select>
                <p className="text-[10px] text-muted-foreground">Drives what instruments FinPilot recommends for this goal</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="goal-flex">Deadline flexibility</Label>
                <select id="goal-flex" className="flex h-11 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm" value={goalForm.flexibility} onChange={(e) => setGoalForm(p => ({ ...p, flexibility: e.target.value }))}>
                  <option value="fixed_deadline">Fixed — Cannot be delayed</option>
                  <option value="flexible">Flexible — Can adjust if needed</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="goal-notes">Notes</Label>
                <Input id="goal-notes" value={goalForm.notes} onChange={(e) => setGoalForm(p => ({ ...p, notes: e.target.value }))} placeholder="Any context for this goal..." />
              </div>
            </div>

            {/* Computed preview */}
            {goalForm.target_amount && goalForm.deadline && (
              <div className="rounded-xl border border-primary/20 bg-primary/5 p-3 text-sm space-y-1">
                <p>
                  <span className="text-muted-foreground">Remaining: </span>
                  <span className="font-semibold">{formatCurrency(Math.max(0, Number(goalForm.target_amount) - Number(goalForm.current_savings || 0)))}</span>
                </p>
                {(() => {
                  const remaining = Math.max(0, Number(goalForm.target_amount) - Number(goalForm.current_savings || 0));
                  const deadlineDate = new Date(goalForm.deadline);
                  const now = new Date();
                  const months = Math.max(1, Math.ceil((deadlineDate.getTime() - now.getTime()) / (30.44 * 24 * 60 * 60 * 1000)));
                  const reqMonthly = remaining / months;
                  return (
                    <p>
                      <span className="text-muted-foreground">Required monthly savings: </span>
                      <span className="font-semibold">{formatCurrency(reqMonthly)}</span>
                      <span className="text-muted-foreground"> over {months} months</span>
                    </p>
                  );
                })()}
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setModal(null)}>Cancel</Button>
            <Button onClick={() => void handleGoalSubmit()} disabled={submitting || !goalForm.target_amount || !goalForm.title}>
              <Goal className="mr-2 h-4 w-4" />
              Save goal
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

/* ---- Alerts Panel ---- */
function AlertsPanel() {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loadingAlerts, setLoadingAlerts] = useState(true);

  useEffect(() => {
    listAlerts()
      .then(setAlerts)
      .catch(() => {})
      .finally(() => setLoadingAlerts(false));
  }, []);

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Bell className="h-4 w-4 text-primary" />
            <h3 className="font-semibold text-sm">Recent Alerts</h3>
          </div>
          {alerts.filter(a => !a.read).length > 0 && (
            <Button variant="ghost" size="sm" onClick={() => {
              markAllAlertsRead().then(() => setAlerts(prev => prev.map(a => ({ ...a, read: true }))));
            }}>Mark all read</Button>
          )}
        </div>
        {loadingAlerts ? (
          <p className="text-xs text-muted-foreground">Loading…</p>
        ) : alerts.length === 0 ? (
          <p className="text-xs text-muted-foreground">No alerts yet. They appear when risk months or goal deadlines are detected.</p>
        ) : (
          <div className="space-y-2 max-h-40 overflow-y-auto">
            {alerts.slice(0, 5).map((a) => (
              <div
                key={a.id}
                className={cn("rounded-lg border p-2 text-xs cursor-pointer", a.read ? "opacity-60" : "border-primary/30 bg-primary/5")}
                onClick={() => {
                  if (!a.read) markAlertRead(a.id).then(() => setAlerts(prev => prev.map(x => x.id === a.id ? { ...x, read: true } : x)));
                }}
              >
                <p className="font-medium">{a.title}</p>
                <p className="text-muted-foreground">{a.message}</p>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}