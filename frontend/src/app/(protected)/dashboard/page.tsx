"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ErrorState, LoadingState } from "@/components/ui/shared";
import { getDashboard } from "@/lib/api";
import type { DashboardSummary } from "@/types/api";
import { useEffect, useState } from "react";

export default function DashboardPage() {
  const [data, setData] = useState<DashboardSummary | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getDashboard()
      .then(setData)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingState />;
  if (error) return <ErrorState message={error} />;
  if (!data) return null;

  const cards = [
    { label: "Total Income", value: `₹${data.total_income.toLocaleString()}`, color: "text-green-600" },
    { label: "Total Expenses", value: `₹${data.total_expenses.toLocaleString()}`, color: "text-red-500" },
    { label: "Net Savings", value: `₹${data.net_savings.toLocaleString()}`, color: "text-blue-600" },
    { label: "Active Goals", value: data.active_goals.toString(), color: "text-primary" },
    { label: "Risk Months", value: data.risk_months.toString(), color: data.risk_months > 0 ? "text-red-500" : "text-green-600" },
    { label: "Salary Docs", value: data.salary_docs_count.toString(), color: "text-primary" },
  ];

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">Dashboard</h1>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {cards.map((c) => (
          <Card key={c.label}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{c.label}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className={`text-2xl font-bold ${c.color}`}>{c.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
