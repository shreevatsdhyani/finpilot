/* API client — switches between real backend calls and mock fixtures */

import * as mock from "@/lib/mock-data";
import type {
    Alert,
    AssistantResponse,
    AuditRecord,
    ChatMessage,
    ChatSession,
    ChatSessionDetail,
    DashboardSummary,
    Expense,
    Forecast,
    Goal,
    ManualSalaryInput,
    NewsArticle,
    NewsFetchApiResponse,
    NewsFilters,
    Policy,
    ReadinessState,
    Recommendation,
    SalaryDoc,
    Scenario,
    ScenarioCompare,
    TokenResponse,
    User,
    UserSettings,
    VoiceResponse,
} from "@/types/api";


const IS_MOCK = process.env.NEXT_PUBLIC_MOCK === "true";
const BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000";

let mockSalaryDocs: SalaryDoc[] = structuredClone(mock.MOCK_SALARY_DOCS);
let mockExpenses: Expense[] = structuredClone(mock.MOCK_EXPENSES);
let mockGoals: Goal[] = structuredClone(mock.MOCK_GOALS);
let mockForecasts: Forecast[] = structuredClone(mock.MOCK_FORECASTS);
let mockScenarios: Scenario[] = structuredClone(mock.MOCK_SCENARIOS);
let mockRecommendations: Recommendation[] = structuredClone(mock.MOCK_RECOMMENDATIONS);

function computeMockDashboard(): DashboardSummary {
  const verifiedSalaryDocs = mockSalaryDocs.filter((doc) => doc.status === "verified");
  const totalIncome = verifiedSalaryDocs.reduce((sum, doc) => {
    const extracted = doc.extracted ?? {};
    const netTakeHome = extracted.net_take_home;
    const netSalary = extracted.net_salary;
    const value = typeof netTakeHome === "number" ? netTakeHome : typeof netSalary === "number" ? netSalary : 0;
    return sum + value;
  }, 0);
  const totalExpenses = mockExpenses.reduce((sum, exp) => sum + exp.amount, 0);
  const latestForecast = mockForecasts.find((item) => item.horizon === 6) ?? mockForecasts[0];

  return {
    total_income: totalIncome,
    total_expenses: totalExpenses,
    net_savings: totalIncome - totalExpenses,
    active_goals: mockGoals.length,
    risk_months: latestForecast ? latestForecast.months.filter((month) => month.risk).length : 0,
    salary_docs_count: mockSalaryDocs.length,
  };
}

export async function getReadinessPayload(): Promise<{
  summary: DashboardSummary;
  salaryDocs: SalaryDoc[];
  expenses: Expense[];
  goals: Goal[];
  forecasts: Forecast[];
  settings: UserSettings;
  scenarios: Scenario[];
  recommendations: Recommendation[];
}> {
  if (IS_MOCK) {
    await delay();
    return {
      summary: computeMockDashboard(),
      salaryDocs: mockSalaryDocs,
      expenses: mockExpenses,
      goals: mockGoals,
      forecasts: mockForecasts,
      settings: mock.MOCK_SETTINGS,
      scenarios: mockScenarios,
      recommendations: mockRecommendations,
    };
  }

  const [summary, salaryDocs, expenses, goals, forecasts, settings, scenarios, recommendations] = await Promise.all([
    getDashboard(),
    listSalary(),
    listExpenses(),
    listGoals(),
    listForecasts(6),
    getSettings(),
    listScenarios(),
    listRecommendations(),
  ]);

  return { summary, salaryDocs, expenses, goals, forecasts, settings, scenarios, recommendations };
}

export function computeReadinessState(payload: {
  salaryDocs: SalaryDoc[];
  expenses: Expense[];
  goals: Goal[];
  forecasts: Forecast[];
  scenarios: Scenario[];
  recommendations: Recommendation[];
}): ReadinessState {
  const incomeExists = payload.salaryDocs.length > 0;
  const incomeVerified = payload.salaryDocs.some((doc) => doc.status === "verified");
  const expensesExists = payload.expenses.length > 0;
  const goalsExists = payload.goals.length > 0;
  const forecastExists = payload.forecasts.some((forecast) => forecast.horizon === 6);
  const scenarioActive = payload.scenarios.some((scenario) => scenario.active);
  const planExists = payload.recommendations.length > 0;

  return {
    incomeExists,
    incomeVerified,
    expensesExists,
    goalsExists,
    forecastExists,
    scenarioActive,
    planExists,
  };
}

/* ---------- helpers ---------- */

function delay(ms = 400): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

function token(): string {
  if (typeof window === "undefined") return "";
  return localStorage.getItem("fp_token") ?? "";
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    ...init,
    headers: {
      ...(init?.headers ?? {}),
      ...(init?.body instanceof FormData ? {} : { "Content-Type": "application/json" }),
      Authorization: `Bearer ${token()}`,
    },
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.detail ?? `HTTP ${res.status}`);
  }
  return res.json() as Promise<T>;
}

/* ---------- Auth ---------- */

export async function register(
  email: string,
  password: string,
  name: string,
): Promise<TokenResponse> {
  if (IS_MOCK) {
    await delay();
    const t: TokenResponse = { access_token: mock.MOCK_TOKEN, token_type: "bearer" };
    localStorage.setItem("fp_token", t.access_token);
    localStorage.setItem("fp_user", JSON.stringify(mock.MOCK_USER));
    return t;
  }
  const t = await request<TokenResponse>("/v1/auth/register", {
    method: "POST",
    body: JSON.stringify({ email, password, name }),
  });
  localStorage.setItem("fp_token", t.access_token);
  return t;
}

export async function login(email: string, password: string): Promise<TokenResponse> {
  if (IS_MOCK) {
    await delay();
    const t: TokenResponse = { access_token: mock.MOCK_TOKEN, token_type: "bearer" };
    localStorage.setItem("fp_token", t.access_token);
    localStorage.setItem("fp_user", JSON.stringify(mock.MOCK_USER));
    return t;
  }
  const t = await request<TokenResponse>("/v1/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
  localStorage.setItem("fp_token", t.access_token);
  return t;
}

export async function getMe(): Promise<User> {
  if (IS_MOCK) {
    await delay(200);
    return mock.MOCK_USER;
  }
  return request<User>("/v1/auth/me");
}

export async function updateMe(data: { name?: string }): Promise<User> {
  if (IS_MOCK) {
    await delay(200);
    const updated = { ...mock.MOCK_USER, ...data };
    Object.assign(mock.MOCK_USER, updated);
    return updated;
  }
  return request<User>("/v1/auth/me", { method: "PATCH", body: JSON.stringify(data) });
}

/* ---------- Dashboard ---------- */

export async function getDashboard(): Promise<DashboardSummary> {
  if (IS_MOCK) { await delay(); return computeMockDashboard(); }
  return request<DashboardSummary>("/v1/dashboard/summary");
}

/* ---------- Salary ---------- */

export async function uploadSalary(file: File): Promise<SalaryDoc> {
  if (IS_MOCK) {
    await delay(800);
    const doc: SalaryDoc = {
      ...mock.MOCK_SALARY_DOCS[0],
      id: `sal-${Date.now()}`,
      filename: file.name,
      status: "extracted",
      created_at: new Date().toISOString(),
    };
    mockSalaryDocs = [doc, ...mockSalaryDocs];
    return doc;
  }
  const fd = new FormData();
  fd.append("file", file);
  return request<SalaryDoc>("/v1/salary/upload", { method: "POST", body: fd });
}

export async function listSalary(): Promise<SalaryDoc[]> {
  if (IS_MOCK) { await delay(); return mockSalaryDocs; }
  return request<SalaryDoc[]>("/v1/salary");
}

export async function getSalary(docId: string): Promise<SalaryDoc> {
  if (IS_MOCK) { await delay(); return mockSalaryDocs.find((d) => d.id === docId) ?? mockSalaryDocs[0]; }
  return request<SalaryDoc>(`/v1/salary/${docId}`);
}

export async function getSalaryStatus(docId: string): Promise<{ doc_id: string; status: string }> {
  if (IS_MOCK) { await delay(); return { doc_id: docId, status: "extracted" }; }
  return request(`/v1/salary/${docId}/status`);
}

export async function verifySalary(docId: string, fields: Record<string, unknown>): Promise<SalaryDoc> {
  if (IS_MOCK) {
    await delay();
    const current = mockSalaryDocs.find((doc) => doc.id === docId) ?? mockSalaryDocs[0];
    const updated = {
      ...current,
      id: docId,
      status: "verified" as const,
      extracted: { ...(current?.extracted ?? {}), ...fields } as Record<string, unknown>,
    };
    mockSalaryDocs = mockSalaryDocs.map((doc) => (doc.id === docId ? updated : doc));
    return updated;
  }
  return request<SalaryDoc>("/v1/salary/verify", { method: "POST", body: JSON.stringify({ doc_id: docId, verified_fields: fields }) });
}

export async function createManualSalary(data: ManualSalaryInput): Promise<SalaryDoc> {
  if (IS_MOCK) {
    await delay(500);
    const doc: SalaryDoc = {
      id: `sal-manual-${Date.now()}`,
      user_id: mock.MOCK_USER.id,
      filename: `manual-income-${data.month ?? new Date().toISOString().slice(0, 7)}`,
      status: "verified",
      extracted: { ...data, source: "manual" },
      created_at: new Date().toISOString(),
    };
    mockSalaryDocs = [doc, ...mockSalaryDocs];
    return doc;
  }
  return request<SalaryDoc>("/v1/salary/manual", { method: "POST", body: JSON.stringify(data) });
}

/* ---------- Expenses & Goals ---------- */

export async function createExpense(data: {
  category: string;
  amount: number;
  frequency?: string;
  is_essential?: boolean;
  is_fixed?: boolean;
  description?: string;
  date?: string;
}): Promise<Expense> {
  if (IS_MOCK) {
    await delay();
    const freq = data.frequency ?? "monthly";
    const freqDiv: Record<string, number> = { monthly: 1, quarterly: 3, "semi-annual": 6, annual: 12 };
    const monthlyAmt = data.amount / (freqDiv[freq] ?? 1);
    const expense: Expense = {
      id: `exp-${Date.now()}`,
      user_id: "mock-user-1",
      category: data.category,
      amount: data.amount,
      frequency: freq,
      is_essential: data.is_essential ?? true,
      is_fixed: data.is_fixed ?? true,
      monthly_amount: monthlyAmt,
      description: data.description ?? "",
      date: data.date ?? null,
    };
    mockExpenses = [expense, ...mockExpenses];
    return expense;
  }
  return request<Expense>("/v1/expenses", { method: "POST", body: JSON.stringify(data) });
}

export async function listExpenses(): Promise<Expense[]> {
  if (IS_MOCK) { await delay(); return mockExpenses; }
  return request<Expense[]>("/v1/expenses");
}

export async function createGoal(data: {
  category?: string;
  title: string;
  target_amount: number;
  current_savings?: number;
  monthly_contribution?: number;
  deadline?: string;
  priority?: string;
  risk_tolerance?: string;
  flexibility?: string;
  notes?: string;
}): Promise<Goal> {
  if (IS_MOCK) {
    await delay();
    const goal: Goal = {
      id: `goal-${Date.now()}`,
      user_id: "mock-user-1",
      category: data.category ?? "Custom",
      title: data.title,
      target_amount: data.target_amount,
      current_savings: data.current_savings ?? 0,
      monthly_contribution: data.monthly_contribution ?? null,
      deadline: data.deadline ?? null,
      priority: (data.priority ?? "medium") as Goal["priority"],
      risk_tolerance: (data.risk_tolerance ?? "moderate") as Goal["risk_tolerance"],
      flexibility: (data.flexibility ?? "flexible") as Goal["flexibility"],
      notes: data.notes ?? "",
      remaining_amount: data.target_amount - (data.current_savings ?? 0),
      months_to_deadline: null,
      required_monthly: null,
    };
    mockGoals = [goal, ...mockGoals];
    return goal;
  }
  return request<Goal>("/v1/goals", { method: "POST", body: JSON.stringify(data) });
}

export async function listGoals(): Promise<Goal[]> {
  if (IS_MOCK) { await delay(); return mockGoals; }
  return request<Goal[]>("/v1/goals");
}

/* ---------- Forecast ---------- */

export async function generateForecast(horizon: number, riskProfile?: string): Promise<Forecast> {
  if (IS_MOCK) {
    await delay(600);
    const forecast = {
      ...mock.MOCK_FORECASTS[0],
      id: `fc-${Date.now()}`,
      horizon,
      created_at: new Date().toISOString(),
      months: mock.MOCK_FORECASTS[0].months.slice(0, horizon),
    };
    mockForecasts = [forecast, ...mockForecasts.filter((item) => item.horizon !== horizon)];
    return forecast;
  }
  return request<Forecast>("/v1/forecast/generate", { method: "POST", body: JSON.stringify({ horizon, risk_profile: riskProfile }) });
}

export async function listForecasts(horizon: number): Promise<Forecast[]> {
  if (IS_MOCK) { await delay(); return mockForecasts.filter((item) => item.horizon === horizon || horizon === 0); }
  return request<Forecast[]>(`/v1/forecast?horizon=${horizon}`);
}

/* ---------- Scenarios ---------- */

export async function createScenario(data: { name: string; description?: string; adjustments: Record<string, number> }): Promise<Scenario> {
  if (IS_MOCK) {
    await delay();
    const scenario = { id: `sc-${Date.now()}`, user_id: "mock-user-1", description: "", active: false, result: null, horizon: 6, ...data };
    mockScenarios = [scenario, ...mockScenarios];
    return scenario;
  }
  return request<Scenario>("/v1/scenarios", { method: "POST", body: JSON.stringify(data) });
}

export async function listScenarios(): Promise<Scenario[]> {
  if (IS_MOCK) { await delay(); return mockScenarios; }
  return request<Scenario[]>("/v1/scenarios");
}

export async function activateScenario(id: string): Promise<Scenario> {
  if (IS_MOCK) {
    await delay();
    let activeScenario = mockScenarios.find((scenario) => scenario.id === id) ?? mockScenarios[0];
    mockScenarios = mockScenarios.map((scenario) => {
      const updated = { ...scenario, active: scenario.id === id };
      if (updated.active) activeScenario = updated;
      return updated;
    });
    return activeScenario;
  }
  return request<Scenario>(`/v1/scenarios/${id}/activate`, { method: "POST" });
}

export async function compareScenarios(ids: string[]): Promise<ScenarioCompare> {
  if (IS_MOCK) { await delay(); return { scenarios: mockScenarios.filter((s) => ids.includes(s.id)) }; }
  return request<ScenarioCompare>(`/v1/scenarios/compare?ids=${ids.join(",")}`);
}

/* ---------- Recommendations ---------- */

export async function generateRecommendations(riskProfile?: string): Promise<Recommendation> {
  if (IS_MOCK) {
    await delay(600);
    const recommendation = { ...mock.MOCK_RECOMMENDATIONS[0], id: `rec-${Date.now()}`, created_at: new Date().toISOString() };
    mockRecommendations = [recommendation, ...mockRecommendations];
    return recommendation;
  }
  return request<Recommendation>("/v1/recommendations/generate", { method: "POST", body: JSON.stringify({ risk_profile: riskProfile }) });
}

export async function listRecommendations(): Promise<Recommendation[]> {
  if (IS_MOCK) { await delay(); return mockRecommendations; }
  return request<Recommendation[]>("/v1/recommendations");
}

export async function getRecommendation(id: string): Promise<Recommendation> {
  if (IS_MOCK) { await delay(); return mock.MOCK_RECOMMENDATIONS[0]; }
  return request<Recommendation>(`/v1/recommendations/${id}`);
}

/* ---------- Assistant ---------- */

export async function assistantQuery(query: string): Promise<AssistantResponse> {
  if (IS_MOCK) { await delay(800); return mock.MOCK_ASSISTANT_RESPONSE; }
  return request<AssistantResponse>("/v1/assistant/query", { method: "POST", body: JSON.stringify({ query }) });
}

export async function voiceQuery(text: string): Promise<VoiceResponse> {
  if (IS_MOCK) { await delay(800); return { ...mock.MOCK_VOICE_RESPONSE, transcript_text: text }; }
  return request<VoiceResponse>("/v1/voice/query", { method: "POST", body: JSON.stringify({ text }) });
}

/* ---------- Policies ---------- */

export async function listPolicies(): Promise<Policy[]> {
  if (IS_MOCK) { await delay(); return mock.MOCK_POLICIES; }
  return request<Policy[]>("/v1/policies");
}

export async function getPolicy(id: string): Promise<Policy> {
  if (IS_MOCK) { await delay(); return mock.MOCK_POLICIES.find((p) => p.id === id) ?? mock.MOCK_POLICIES[0]; }
  return request<Policy>(`/v1/policies/${id}`);
}

export async function subscribePolicy(id: string): Promise<{ message: string }> {
  if (IS_MOCK) { await delay(); return { message: "Subscribed" }; }
  return request(`/v1/policies/${id}/subscribe`, { method: "POST" });
}

/* ---------- News ---------- */

export async function fetchLatestNews(filters: NewsFilters): Promise<NewsFetchApiResponse> {
  const body = {
    q: filters.q ?? null,
    country: filters.country ?? null,
    category: filters.category ?? null,
    language: filters.language ?? "en",
    size: filters.size ?? 10,
    page: filters.page ?? null,
  };

  if (IS_MOCK) {
    await delay();
    const mockResults: NewsArticle[] = mock.MOCK_NEWS.map((item) => ({
      article_id: item.id,
      title: item.title,
      description: item.summary,
      link: item.url,
      source_name: "FinPilot Mock",
      source_icon: "",
      image_url: null,
      pubDate: new Date().toISOString().slice(0, 19).replace("T", " "),
      pubDateTZ: "UTC",
    }));

    return {
      source: "mock",
      request: body,
      status_code: 200,
      upstream: {
        status: "success",
        totalResults: mockResults.length,
        results: mockResults,
        nextPage: undefined,
      },
    };
  }

  return request<NewsFetchApiResponse>("/v1/news", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

/* ---------- Audit ---------- */

export async function listAudits(): Promise<AuditRecord[]> {
  if (IS_MOCK) { await delay(); return mock.MOCK_AUDITS; }
  return request<AuditRecord[]>("/v1/audit");
}

export async function getAudit(id: string): Promise<AuditRecord> {
  if (IS_MOCK) { await delay(); return mock.MOCK_AUDITS.find((a) => a.id === id) ?? mock.MOCK_AUDITS[0]; }
  return request<AuditRecord>(`/v1/audit/${id}`);
}

/* ---------- Settings ---------- */

export async function getSettings(): Promise<UserSettings> {
  if (IS_MOCK) { await delay(); return mock.MOCK_SETTINGS; }
  return request<UserSettings>("/v1/settings");
}

export async function updateSettings(data: Partial<UserSettings>): Promise<UserSettings> {
  if (IS_MOCK) { await delay(); return { ...mock.MOCK_SETTINGS, ...data }; }
  return request<UserSettings>("/v1/settings", { method: "POST", body: JSON.stringify(data) });
}

/* ---------- Alerts ---------- */

export async function listAlerts(): Promise<Alert[]> {
  if (IS_MOCK) { await delay(); return []; }
  return request<Alert[]>("/v1/alerts");
}

export async function getUnreadAlertCount(): Promise<number> {
  if (IS_MOCK) { return 0; }
  const data = await request<{ count: number }>("/v1/alerts/unread-count");
  return data.count;
}

export async function markAlertRead(alertId: string): Promise<void> {
  if (IS_MOCK) { return; }
  await request(`/v1/alerts/${alertId}/read`, { method: "POST" });
}

export async function markAllAlertsRead(): Promise<void> {
  if (IS_MOCK) { return; }
  await request("/v1/alerts/read-all", { method: "POST" });
}

/* ---------- Chat Sessions ---------- */

export async function listChatSessions(): Promise<ChatSession[]> {
  if (IS_MOCK) { await delay(); return []; }
  return request<ChatSession[]>("/v1/chat/sessions");
}

export async function createChatSession(): Promise<ChatSession> {
  if (IS_MOCK) {
    await delay();
    return {
      id: `chat-${Date.now()}`, user_id: "mock-user-1",
      title: "New conversation", message_count: 0,
      created_at: new Date().toISOString(), updated_at: new Date().toISOString(),
    };
  }
  return request<ChatSession>("/v1/chat/sessions", { method: "POST" });
}

export async function getChatSession(sessionId: string): Promise<ChatSessionDetail> {
  if (IS_MOCK) {
    await delay();
    return {
      id: sessionId, user_id: "mock-user-1",
      title: "New conversation", messages: [],
      created_at: new Date().toISOString(), updated_at: new Date().toISOString(),
    };
  }
  return request<ChatSessionDetail>(`/v1/chat/sessions/${sessionId}`);
}

export async function sendChatMessage(
  sessionId: string, content: string
): Promise<{ user_message: ChatMessage; assistant_message: ChatMessage }> {
  if (IS_MOCK) {
    await delay(800);
    const now = new Date().toISOString();
    return {
      user_message: { role: "user", content, sources: [], timestamp: now },
      assistant_message: {
        role: "assistant",
        content: mock.MOCK_ASSISTANT_RESPONSE.answer,
        sources: mock.MOCK_ASSISTANT_RESPONSE.sources,
        timestamp: now,
      },
    };
  }
  return request(`/v1/chat/sessions/${sessionId}/messages`, {
    method: "POST",
    body: JSON.stringify({ content }),
  });
}

export async function deleteChatSession(sessionId: string): Promise<void> {
  if (IS_MOCK) { return; }
  await request(`/v1/chat/sessions/${sessionId}`, { method: "DELETE" });
}

