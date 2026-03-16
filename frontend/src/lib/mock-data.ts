/* Mock fixture data for MOCK mode */

import type {
    AssistantResponse,
    AuditRecord,
    Bucket,
    DashboardSummary,
    Expense,
    Forecast,
    ForecastMonth,
    Goal,
    NewsItem,
    Policy,
    Recommendation,
    SalaryDoc,
    Scenario,
    UserSettings,
    VoiceResponse,
} from "@/types/api";

export const MOCK_USER = { id: "mock-user-1", email: "jane@example.com", name: "Jane Doe" };
export const MOCK_TOKEN = "mock-jwt-token-abc123";

export const MOCK_DASHBOARD: DashboardSummary = {
  total_income: 219000,
  total_expenses: 126000,
  net_savings: 93000,
  active_goals: 3,
  risk_months: 1,
  salary_docs_count: 3,
};

export const MOCK_SALARY_DOCS: SalaryDoc[] = [
  {
    id: "sal-1",
    user_id: "mock-user-1",
    filename: "salary_jan2026.pdf",
    status: "verified",
    extracted: { employee_name: "Jane Doe", employer: "Acme Corp", month: "2026-01", gross_salary: 85000, deductions: 12000, net_salary: 73000 },
    created_at: "2026-01-31T10:00:00Z",
  },
  {
    id: "sal-2",
    user_id: "mock-user-1",
    filename: "salary_feb2026.pdf",
    status: "extracted",
    extracted: { employee_name: "Jane Doe", employer: "Acme Corp", month: "2026-02", gross_salary: 85000, deductions: 12000, net_salary: 73000 },
    created_at: "2026-02-28T10:00:00Z",
  },
];

export const MOCK_EXPENSES: Expense[] = [
  { id: "exp-1", user_id: "mock-user-1", category: "Rent", amount: 25000, description: "Monthly rent", date: "2026-02-01" },
  { id: "exp-2", user_id: "mock-user-1", category: "Groceries", amount: 8000, description: "Monthly groceries", date: "2026-02-05" },
  { id: "exp-3", user_id: "mock-user-1", category: "Utilities", amount: 3000, description: "Electricity & water", date: "2026-02-10" },
  { id: "exp-4", user_id: "mock-user-1", category: "Transport", amount: 5000, description: "Fuel & metro", date: "2026-02-15" },
  { id: "exp-5", user_id: "mock-user-1", category: "Dining", amount: 4000, description: "Eating out", date: "2026-02-20" },
];

export const MOCK_GOALS: Goal[] = [
  { id: "goal-1", user_id: "mock-user-1", title: "Emergency Fund", target_amount: 450000, deadline: "2026-12-31", priority: "high" },
  { id: "goal-2", user_id: "mock-user-1", title: "Vacation", target_amount: 150000, deadline: "2026-06-30", priority: "medium" },
  { id: "goal-3", user_id: "mock-user-1", title: "New Laptop", target_amount: 80000, deadline: "2026-09-30", priority: "low" },
];

const forecastMonths: ForecastMonth[] = [
  { month: "2026-03", projected_income: 73000, projected_expenses: 45000, net: 28000, risk: false },
  { month: "2026-04", projected_income: 73000, projected_expenses: 46000, net: 27000, risk: false },
  { month: "2026-05", projected_income: 73000, projected_expenses: 48000, net: 25000, risk: false },
  { month: "2026-06", projected_income: 73000, projected_expenses: 50000, net: 23000, risk: false },
  { month: "2026-07", projected_income: 73000, projected_expenses: 55000, net: 18000, risk: false },
  { month: "2026-08", projected_income: 73000, projected_expenses: 78000, net: -5000, risk: true },
];

export const MOCK_FORECASTS: Forecast[] = [
  { id: "fc-1", user_id: "mock-user-1", horizon: 6, months: forecastMonths, created_at: "2026-02-28T08:00:00Z" },
];

export const MOCK_SCENARIOS: Scenario[] = [
  {
    id: "sc-1", user_id: "mock-user-1", name: "Raise +10%", description: "What if I get a 10% raise?",
    adjustments: { income_change_pct: 10, expense_change_pct: 0 }, active: true,
    result: { adjusted_monthly_income: 80300, adjusted_monthly_expense: 45000, monthly_net: 35300, horizon: 6, projected_savings: 211800, risk: false },
  },
  {
    id: "sc-2", user_id: "mock-user-1", name: "Expense +20%", description: "What if expenses rise 20%?",
    adjustments: { income_change_pct: 0, expense_change_pct: 20 }, active: false,
    result: { adjusted_monthly_income: 73000, adjusted_monthly_expense: 54000, monthly_net: 19000, horizon: 6, projected_savings: 114000, risk: false },
  },
];

const mockBuckets: Bucket[] = [
  { name: "Emergency Fund", allocation_pct: 20, rationale: "Continue building safety net." },
  { name: "Fixed Income", allocation_pct: 30, rationale: "Stable returns, low risk." },
  { name: "Equities", allocation_pct: 35, rationale: "Long-term growth." },
  { name: "Gold / Commodities", allocation_pct: 10, rationale: "Hedge against inflation." },
  { name: "Cash / Liquid", allocation_pct: 5, rationale: "Short-term liquidity." },
];

export const MOCK_RECOMMENDATIONS: Recommendation[] = [
  { id: "rec-1", user_id: "mock-user-1", safe_to_invest: 23000, buckets: mockBuckets, created_at: "2026-02-28T09:00:00Z" },
];

export const MOCK_ASSISTANT_RESPONSE: AssistantResponse = {
  answer:
    "Based on your financial policies, you should maintain an emergency fund covering 6 months of expenses, prioritise high-interest debt repayment, and diversify across at least three asset classes.",
  sources: [
    { title: "Emergency Fund Policy", snippet: "Maintain at least 6 months of essential expenses in a liquid savings account." },
    { title: "Diversification Guideline", snippet: "Spread investments across at least three asset classes." },
  ],
  audit_id: "aud-1",
};

export const MOCK_VOICE_RESPONSE: VoiceResponse = {
  transcript_text: "How should I allocate my savings?",
  answer_text: MOCK_ASSISTANT_RESPONSE.answer,
  tts_url: "",
  sources: MOCK_ASSISTANT_RESPONSE.sources,
  audit_id: "aud-2",
};

export const MOCK_POLICIES: Policy[] = [
  { id: "pol-1", title: "Emergency Fund Policy", body: "Maintain at least 6 months of essential expenses in a liquid savings account before allocating to higher-risk investments.", category: "savings" },
  { id: "pol-2", title: "Debt Repayment Priority", body: "Prioritise paying off high-interest debt (>8% APR) before investing surplus income.", category: "debt" },
  { id: "pol-3", title: "Diversification Guideline", body: "Spread investments across at least three asset classes: equities, fixed income, and cash equivalents.", category: "investment" },
  { id: "pol-4", title: "Insurance Adequacy", body: "Ensure term life cover equals at least 10x annual income. Health insurance should cover the whole family.", category: "insurance" },
  { id: "pol-5", title: "Tax-Advantaged Accounts", body: "Maximise contributions to tax-advantaged retirement accounts (e.g., 401k, PPF, NPS) before taxable investments.", category: "tax" },
];

export const MOCK_NEWS: NewsItem[] = [
  { id: "news-1", title: "RBI holds repo rate steady at 6.5%", summary: "The Reserve Bank of India maintained the repo rate, signalling stable monetary policy.", url: "https://example.com/rbi-rate", category: "macro" },
  { id: "news-2", title: "Equity markets hit all-time high", summary: "Benchmark indices surged 2% on strong FII inflows.", url: "https://example.com/markets-high", category: "markets" },
];

export const MOCK_AUDITS: AuditRecord[] = [
  { id: "aud-1", user_id: "mock-user-1", action: "assistant_query", request_summary: "How should I allocate my savings?", response_summary: "Based on your financial policies...", created_at: "2026-02-28T08:30:00Z" },
  { id: "aud-2", user_id: "mock-user-1", action: "voice_query", request_summary: "How should I allocate my savings?", response_summary: "Based on your financial policies...", created_at: "2026-02-28T08:31:00Z" },
  { id: "aud-3", user_id: "mock-user-1", action: "recommendation_generate", request_summary: "Generated investment recommendations", response_summary: "safe_to_invest=23000", created_at: "2026-02-28T09:00:00Z" },
];

export const MOCK_SETTINGS: UserSettings = {
  user_id: "mock-user-1",
  currency: "INR",
  locale: "en-IN",
  theme: "light",
  notifications: true,
};
