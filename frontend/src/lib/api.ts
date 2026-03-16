/* API client — switches between real backend calls and mock fixtures */

import * as mock from "@/lib/mock-data";
import type {
    AssistantResponse,
    AuditRecord,
    DashboardSummary,
    Expense,
    Forecast,
    Goal,
    NewsItem,
    NewsSummary,
    Policy,
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

export async function register(email: string, password: string, name: string): Promise<TokenResponse> {
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

/* ---------- Dashboard ---------- */

export async function getDashboard(): Promise<DashboardSummary> {
  if (IS_MOCK) { await delay(); return mock.MOCK_DASHBOARD; }
  return request<DashboardSummary>("/v1/dashboard/summary");
}

/* ---------- Salary ---------- */

export async function uploadSalary(file: File): Promise<SalaryDoc> {
  if (IS_MOCK) {
    await delay(800);
    return { ...mock.MOCK_SALARY_DOCS[0], id: `sal-${Date.now()}`, filename: file.name, status: "extracted" };
  }
  const fd = new FormData();
  fd.append("file", file);
  return request<SalaryDoc>("/v1/salary/upload", { method: "POST", body: fd });
}

export async function listSalary(): Promise<SalaryDoc[]> {
  if (IS_MOCK) { await delay(); return mock.MOCK_SALARY_DOCS; }
  return request<SalaryDoc[]>("/v1/salary");
}

export async function getSalary(docId: string): Promise<SalaryDoc> {
  if (IS_MOCK) { await delay(); return mock.MOCK_SALARY_DOCS.find((d) => d.id === docId) ?? mock.MOCK_SALARY_DOCS[0]; }
  return request<SalaryDoc>(`/v1/salary/${docId}`);
}

export async function getSalaryStatus(docId: string): Promise<{ doc_id: string; status: string }> {
  if (IS_MOCK) { await delay(); return { doc_id: docId, status: "extracted" }; }
  return request(`/v1/salary/${docId}/status`);
}

export async function verifySalary(docId: string, fields: Record<string, unknown>): Promise<SalaryDoc> {
  if (IS_MOCK) {
    await delay();
    return { ...mock.MOCK_SALARY_DOCS[0], id: docId, status: "verified", extracted: { ...mock.MOCK_SALARY_DOCS[0].extracted, ...fields } as Record<string, unknown> };
  }
  return request<SalaryDoc>("/v1/salary/verify", { method: "POST", body: JSON.stringify({ doc_id: docId, verified_fields: fields }) });
}

/* ---------- Expenses & Goals ---------- */

export async function createExpense(data: { category: string; amount: number; description?: string; date?: string }): Promise<Expense> {
  if (IS_MOCK) { await delay(); return { id: `exp-${Date.now()}`, user_id: "mock-user-1", description: "", date: null, ...data }; }
  return request<Expense>("/v1/expenses", { method: "POST", body: JSON.stringify(data) });
}

export async function listExpenses(): Promise<Expense[]> {
  if (IS_MOCK) { await delay(); return mock.MOCK_EXPENSES; }
  return request<Expense[]>("/v1/expenses");
}

export async function createGoal(data: { title: string; target_amount: number; deadline?: string; priority?: string }): Promise<Goal> {
  if (IS_MOCK) { await delay(); return { id: `goal-${Date.now()}`, user_id: "mock-user-1", deadline: null, priority: "medium", ...data } as Goal; }
  return request<Goal>("/v1/goals", { method: "POST", body: JSON.stringify(data) });
}

export async function listGoals(): Promise<Goal[]> {
  if (IS_MOCK) { await delay(); return mock.MOCK_GOALS; }
  return request<Goal[]>("/v1/goals");
}

/* ---------- Forecast ---------- */

export async function generateForecast(horizon: number): Promise<Forecast> {
  if (IS_MOCK) { await delay(600); return { ...mock.MOCK_FORECASTS[0], horizon, months: mock.MOCK_FORECASTS[0].months.slice(0, horizon) }; }
  return request<Forecast>("/v1/forecast/generate", { method: "POST", body: JSON.stringify({ horizon }) });
}

export async function listForecasts(horizon: number): Promise<Forecast[]> {
  if (IS_MOCK) { await delay(); return mock.MOCK_FORECASTS; }
  return request<Forecast[]>(`/v1/forecast?horizon=${horizon}`);
}

/* ---------- Scenarios ---------- */

export async function createScenario(data: { name: string; description?: string; adjustments: Record<string, number> }): Promise<Scenario> {
  if (IS_MOCK) { await delay(); return { id: `sc-${Date.now()}`, user_id: "mock-user-1", description: "", active: false, result: null, ...data }; }
  return request<Scenario>("/v1/scenarios", { method: "POST", body: JSON.stringify(data) });
}

export async function listScenarios(): Promise<Scenario[]> {
  if (IS_MOCK) { await delay(); return mock.MOCK_SCENARIOS; }
  return request<Scenario[]>("/v1/scenarios");
}

export async function activateScenario(id: string): Promise<Scenario> {
  if (IS_MOCK) { await delay(); return { ...mock.MOCK_SCENARIOS[0], id, active: true }; }
  return request<Scenario>(`/v1/scenarios/${id}/activate`, { method: "POST" });
}

export async function compareScenarios(ids: string[]): Promise<ScenarioCompare> {
  if (IS_MOCK) { await delay(); return { scenarios: mock.MOCK_SCENARIOS.filter((s) => ids.includes(s.id)) }; }
  return request<ScenarioCompare>(`/v1/scenarios/compare?ids=${ids.join(",")}`);
}

/* ---------- Recommendations ---------- */

export async function generateRecommendations(): Promise<Recommendation> {
  if (IS_MOCK) { await delay(600); return mock.MOCK_RECOMMENDATIONS[0]; }
  return request<Recommendation>("/v1/recommendations/generate", { method: "POST" });
}

export async function listRecommendations(): Promise<Recommendation[]> {
  if (IS_MOCK) { await delay(); return mock.MOCK_RECOMMENDATIONS; }
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

export async function listNews(): Promise<NewsItem[]> {
  if (IS_MOCK) { await delay(); return mock.MOCK_NEWS; }
  return request<NewsItem[]>("/v1/news");
}

export async function getNews(id: string): Promise<NewsItem> {
  if (IS_MOCK) { await delay(); return mock.MOCK_NEWS.find((n) => n.id === id) ?? mock.MOCK_NEWS[0]; }
  return request<NewsItem>(`/v1/news/${id}`);
}

export async function summarizeNews(id: string): Promise<NewsSummary> {
  if (IS_MOCK) { await delay(); const n = mock.MOCK_NEWS.find((x) => x.id === id) ?? mock.MOCK_NEWS[0]; return { id: n.id, title: n.title, summary: n.summary }; }
  return request<NewsSummary>(`/v1/news/${id}/summarize`, { method: "POST" });
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
