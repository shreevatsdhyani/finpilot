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
  { month: "2026-03", projected_income: 73000, projected_expenses: 45000, net: 28000, cumulative_savings: 28000, risk: false },
  { month: "2026-04", projected_income: 73000, projected_expenses: 46000, net: 27000, cumulative_savings: 55000, risk: false },
  { month: "2026-05", projected_income: 73000, projected_expenses: 48000, net: 25000, cumulative_savings: 80000, risk: false },
  { month: "2026-06", projected_income: 73000, projected_expenses: 50000, net: 23000, cumulative_savings: 103000, risk: false },
  { month: "2026-07", projected_income: 73000, projected_expenses: 55000, net: 18000, cumulative_savings: 121000, risk: false },
  { month: "2026-08", projected_income: 73000, projected_expenses: 78000, net: -5000, cumulative_savings: 116000, risk: true },
];

export const MOCK_FORECASTS: Forecast[] = [
  { id: "fc-1", user_id: "mock-user-1", horizon: 6, months: forecastMonths, risk_month_count: 1, model_version: "v1_linear", created_at: "2026-02-28T08:00:00Z" },
];

export const MOCK_SCENARIOS: Scenario[] = [
  {
    id: "sc-1", user_id: "mock-user-1", name: "Raise +10%", description: "What if I get a 10% raise?",
    adjustments: { income_change_pct: 10, expense_change_pct: 0 }, horizon: 6, active: true,
    result: { adjusted_monthly_income: 80300, adjusted_monthly_expense: 45000, monthly_net: 35300, horizon: 6, projected_savings: 211800, risk_month_count: 0, risk: false, months: [] },
  },
  {
    id: "sc-2", user_id: "mock-user-1", name: "Expense +20%", description: "What if expenses rise 20%?",
    adjustments: { income_change_pct: 0, expense_change_pct: 20 }, horizon: 6, active: false,
    result: { adjusted_monthly_income: 73000, adjusted_monthly_expense: 54000, monthly_net: 19000, horizon: 6, projected_savings: 114000, risk_month_count: 0, risk: false, months: [] },
  },
];

const mockBuckets: Bucket[] = [
  { name: "Emergency Fund", allocation_pct: 20, allocation_amount: 4600, rationale: "Continue building safety net.", instruments: ["Savings Account", "Liquid Fund"] },
  { name: "Fixed Income", allocation_pct: 30, allocation_amount: 6900, rationale: "Stable returns, low risk.", instruments: ["FD", "PPF"] },
  { name: "Equities", allocation_pct: 35, allocation_amount: 8050, rationale: "Long-term growth.", instruments: ["Nifty 50 Index Fund", "Flexi Cap"] },
  { name: "Gold / Commodities", allocation_pct: 10, allocation_amount: 2300, rationale: "Hedge against inflation.", instruments: ["Gold ETF", "SGB"] },
  { name: "Cash / Liquid", allocation_pct: 5, allocation_amount: 1150, rationale: "Short-term liquidity.", instruments: ["Savings Account"] },
];

export const MOCK_RECOMMENDATIONS: Recommendation[] = [
  { id: "rec-1", user_id: "mock-user-1", safe_to_invest: 23000, risk_profile: "moderate", buckets: mockBuckets, inputs_snapshot: { monthly_income: 73000, monthly_expense: 45000, emergency_gap: 5000 }, created_at: "2026-02-28T09:00:00Z" },
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
  { id: "pol-1", title: "Section 80C – Deductions on Investments", summary: "Up to ₹1.5 lakh per year can be deducted from taxable income via specified instruments like PPF, ELSS, and EPF.", body: "Under Section 80C of the Income Tax Act, 1961, individual taxpayers and HUFs can claim deductions up to ₹1,50,000 per financial year. Eligible instruments include Public Provident Fund (PPF), Equity-Linked Savings Schemes (ELSS), Employee Provident Fund (EPF), National Savings Certificates (NSC), 5-year fixed deposits, Sukanya Samriddhi Yojana, and life insurance premiums.", category: "tax", tags: ["80C", "tax saving", "PPF", "ELSS"], region: "India", source_url: "https://incometaxindia.gov.in/Pages/acts/income-tax-act.aspx", source_name: "Income Tax Department", published_at: "2024-04-01", effective_from: "2024-04-01", last_updated: "2025-01-01", version: 1 },
  { id: "pol-2", title: "Emergency Fund – 6 Months of Expenses", summary: "Maintain 6 months of essential expenses in a liquid savings/sweep account before investing in volatile assets.", body: "An emergency fund is the foundation of sound financial planning. It protects against job loss, medical emergencies, and unexpected expenses. The recommended size is 6 months of essential monthly expenses.", category: "savings", tags: ["emergency fund", "liquid fund", "savings"], region: "India", source_url: "https://www.rbi.org.in/financialeducation/", source_name: "RBI Financial Literacy", published_at: "2024-01-01", effective_from: "2024-01-01", last_updated: "2025-01-01", version: 1 },
  { id: "pol-3", title: "Term Life Insurance – Adequate Cover Guideline", summary: "Ensure term life cover equals at least 10-15x annual income to protect dependents.", body: "Term life insurance provides a death benefit to nominees. Financial planners recommend a cover of at least 10-15 times annual income. Pure term plans are the most cost-effective form of life insurance.", category: "insurance", tags: ["term insurance", "life cover", "80C"], region: "India", source_url: "https://www.irdai.gov.in/", source_name: "IRDAI", published_at: "2024-01-15", effective_from: "2024-01-15", last_updated: "2025-01-01", version: 1 },
  { id: "pol-4", title: "Credit Score – CIBIL Score Importance", summary: "A CIBIL score of 750+ is essential for loan approvals at competitive interest rates.", body: "Your CIBIL score ranges from 300 to 900 and is the primary factor used by banks to evaluate creditworthiness. Key factors include payment history (35%), credit utilisation (30%), credit mix, and credit age.", category: "credit", tags: ["CIBIL", "credit score", "loan"], region: "India", source_url: "https://www.cibil.com/", source_name: "TransUnion CIBIL", published_at: "2024-03-01", effective_from: "2024-03-01", last_updated: "2025-01-01", version: 1 },
  { id: "pol-5", title: "SIP in Equity Mutual Funds", summary: "SIP allows disciplined monthly investing in mutual funds, averaging purchase cost over market cycles.", body: "A Systematic Investment Plan lets investors put a fixed amount into a mutual fund scheme every month. For long-term wealth creation (7+ years), equity mutual funds via SIP have historically delivered 12-15% CAGR.", category: "investing", tags: ["SIP", "mutual funds", "equity", "ELSS"], region: "India", source_url: "https://www.sebi.gov.in/", source_name: "SEBI", published_at: "2024-08-01", effective_from: "2024-08-01", last_updated: "2025-01-01", version: 1 },
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
  theme: "system",
  notifications: true,
  risk_profile: "balanced",
  store_salary_files: true,
  store_voice_transcripts: true,
};
