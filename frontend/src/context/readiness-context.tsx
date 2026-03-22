"use client";

import { useAuth } from "@/context/auth-context";
import { computeReadinessState, getReadinessPayload } from "@/lib/api";
import type {
    DashboardSummary,
    Expense,
    Forecast,
    Goal,
    ReadinessState,
    Recommendation,
    SalaryDoc,
    Scenario,
    UserSettings,
} from "@/types/api";
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

type LockedRouteKey = "/salary" | "/cashflow" | "/scenarios" | "/investments";

export interface MissingStep {
  id: "income" | "expenses" | "goals" | "forecast" | "plan";
  title: string;
  description: string;
  complete: boolean;
  recommended?: boolean;
  ctaLabel: string;
}

interface ReadinessContextValue {
  loading: boolean;
  error: string;
  refresh: () => Promise<void>;
  summary: DashboardSummary | null;
  salaryDocs: SalaryDoc[];
  expenses: Expense[];
  goals: Goal[];
  forecasts: Forecast[];
  settings: UserSettings | null;
  scenarios: Scenario[];
  recommendations: Recommendation[];
  flags: ReadinessState;
  lockedRoutes: Record<LockedRouteKey, boolean>;
  missingSteps: MissingStep[];
}

const defaultFlags: ReadinessState = {
  incomeExists: false,
  incomeVerified: false,
  expensesExists: false,
  goalsExists: false,
  forecastExists: false,
  scenarioActive: false,
  planExists: false,
};

const ReadinessContext = createContext<ReadinessContextValue>({
  loading: true,
  error: "",
  refresh: async () => {},
  summary: null,
  salaryDocs: [],
  expenses: [],
  goals: [],
  forecasts: [],
  settings: null,
  scenarios: [],
  recommendations: [],
  flags: defaultFlags,
  lockedRoutes: {
    "/salary": false,
    "/cashflow": true,
    "/scenarios": true,
    "/investments": true,
  },
  missingSteps: [],
});

export function ReadinessProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [salaryDocs, setSalaryDocs] = useState<SalaryDoc[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [forecasts, setForecasts] = useState<Forecast[]>([]);
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [scenarios, setScenarios] = useState<Scenario[]>([]);
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);

  const refresh = useCallback(async () => {
    if (!user) {
      setSummary(null);
      setSalaryDocs([]);
      setExpenses([]);
      setGoals([]);
      setForecasts([]);
      setSettings(null);
      setScenarios([]);
      setRecommendations([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError("");
    try {
      const payload = await getReadinessPayload();
      setSummary(payload.summary);
      setSalaryDocs(payload.salaryDocs);
      setExpenses(payload.expenses);
      setGoals(payload.goals);
      setForecasts(payload.forecasts);
      setSettings(payload.settings);
      setScenarios(payload.scenarios);
      setRecommendations(payload.recommendations);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load readiness state");
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const flags = useMemo(
    () =>
      computeReadinessState({
        salaryDocs,
        expenses,
        goals,
        forecasts,
        scenarios,
        recommendations,
      }),
    [salaryDocs, expenses, goals, forecasts, scenarios, recommendations]
  );

  const lockedRoutes = useMemo(
    () => ({
      "/salary": false,
      "/cashflow": !(flags.incomeExists && flags.expensesExists),
      "/scenarios": !flags.forecastExists,
      "/investments": !(flags.forecastExists && flags.incomeExists && flags.expensesExists),
    }),
    [flags]
  );

  const missingSteps = useMemo<MissingStep[]>(
    () => [
      {
        id: "income",
        title: "Add income",
        description: flags.incomeExists
          ? flags.incomeVerified
            ? "Income source connected and verified."
            : "Income added, but it still needs verification for better forecasting."
          : "Upload a salary slip or enter monthly income manually.",
        complete: flags.incomeExists,
        ctaLabel: "Add income",
      },
      {
        id: "expenses",
        title: "Add expenses baseline",
        description: flags.expensesExists
          ? "Monthly expense baseline is available."
          : "Map at least one monthly expense to unlock cashflow planning.",
        complete: flags.expensesExists,
        ctaLabel: "Add expenses",
      },
      {
        id: "goals",
        title: "Add a goal",
        description: flags.goalsExists
          ? "Goals are connected to planning outputs."
          : "Recommended: add at least one goal so the app can project completion timing.",
        complete: flags.goalsExists,
        recommended: true,
        ctaLabel: "Add goal",
      },
      {
        id: "forecast",
        title: "Generate 6-month forecast",
        description: flags.forecastExists
          ? "6-month forecast is ready."
          : "Forecasts unlock risk months and scenario planning.",
        complete: flags.forecastExists,
        ctaLabel: "Generate forecast",
      },
      {
        id: "plan",
        title: "Generate investment plan",
        description: flags.planExists
          ? "Recommendation engine has produced a plan."
          : "Generate your first explainable investment allocation plan.",
        complete: flags.planExists,
        ctaLabel: "Generate plan",
      },
    ],
    [flags]
  );

  return (
    <ReadinessContext.Provider
      value={{
        loading,
        error,
        refresh,
        summary,
        salaryDocs,
        expenses,
        goals,
        forecasts,
        settings,
        scenarios,
        recommendations,
        flags,
        lockedRoutes,
        missingSteps,
      }}
    >
      {children}
    </ReadinessContext.Provider>
  );
}

export function useReadiness() {
  return useContext(ReadinessContext);
}