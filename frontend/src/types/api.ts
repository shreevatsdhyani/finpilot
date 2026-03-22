/* FinPilot API type definitions — mirrors backend Pydantic models */

export interface TokenResponse {
  access_token: string;
  token_type: string;
}

export interface User {
  id: string;
  email: string;
  name: string;
}

export interface DashboardSummary {
  total_income: number;
  total_expenses: number;
  net_savings: number;
  active_goals: number;
  risk_months: number;
  salary_docs_count: number;
}

export interface SalaryDoc {
  id: string;
  user_id: string;
  filename: string;
  status: "pending" | "extracted" | "verified";
  extracted: Record<string, unknown> | null;
  created_at: string | null;
}

export interface AdditionalIncomeSource {
  source_type: string; // freelance | rental | dividend | interest | other
  label: string;
  monthly_amount: number;
}

export interface ManualSalaryInput {
  // Core (required)
  net_take_home: number;
  // Source metadata
  income_source_type?: string; // salary | freelance | business | rental | pension | other
  employer_name?: string;
  pay_frequency?: string; // monthly | bi-weekly | weekly | annual
  // Indian payroll earnings
  ctc_annual?: number;
  gross_monthly?: number;
  basic?: number;
  hra?: number;
  da?: number;
  special_allowance?: number;
  other_allowances?: number;
  performance_bonus?: number;
  variable_pay?: number;
  // Statutory deductions
  pf_employee?: number;
  professional_tax?: number;
  income_tax_tds?: number;
  esi_contribution?: number;
  other_deductions?: number;
  // Additional income sources
  additional_incomes?: AdditionalIncomeSource[];
  // Period
  month?: string;
}

export interface Expense {
  id: string;
  user_id: string;
  category: string;
  amount: number;
  frequency: string; // monthly | quarterly | semi-annual | annual
  is_essential: boolean;
  is_fixed: boolean;
  monthly_amount: number; // Computed: normalized to monthly
  description: string;
  date: string | null;
}

export interface Goal {
  id: string;
  user_id: string;
  category: string;
  title: string;
  target_amount: number;
  current_savings: number;
  monthly_contribution: number | null;
  deadline: string | null;
  priority: "critical" | "high" | "medium" | "low";
  risk_tolerance: "conservative" | "moderate" | "aggressive";
  flexibility: "fixed_deadline" | "flexible";
  notes: string;
  // Computed
  remaining_amount: number;
  months_to_deadline: number | null;
  required_monthly: number | null;
}

export interface ForecastMonth {
  month: string;
  projected_income: number;
  projected_expenses: number;
  net: number;
  cumulative_savings: number;
  risk: boolean;
}

export interface Forecast {
  id: string;
  user_id: string;
  horizon: number;
  months: ForecastMonth[];
  risk_month_count: number;
  model_version: string;
  created_at: string | null;
}

export interface Scenario {
  id: string;
  user_id: string;
  name: string;
  description: string;
  adjustments: Record<string, number>;
  horizon: number;
  active: boolean;
  result: ScenarioResult | null;
}

export interface ScenarioResult {
  adjusted_monthly_income: number;
  adjusted_monthly_expense: number;
  monthly_net: number;
  horizon: number;
  projected_savings: number;
  risk_month_count: number;
  risk: boolean;
  months: ForecastMonth[];
}

export interface ScenarioCompare {
  scenarios: Scenario[];
}

export interface Bucket {
  name: string;
  allocation_pct: number;
  allocation_amount: number;
  rationale: string;
  instruments: string[];
}

export interface Recommendation {
  id: string;
  user_id: string;
  safe_to_invest: number;
  risk_profile: string;
  buckets: Bucket[];
  inputs_snapshot: Record<string, number>;
  created_at: string | null;
}

export interface Source {
  title: string;
  snippet: string;
}

export interface AssistantResponse {
  answer: string;
  sources: Source[];
  audit_id: string;
}

export interface VoiceResponse {
  transcript_text: string;
  answer_text: string;
  tts_url: string;
  sources: Source[];
  audit_id: string;
}

export interface Policy {
  id: string;
  title: string;
  summary: string;
  body: string;
  category: string;
  tags: string[];
  region: string;
  source_url: string | null;
  source_name: string | null;
  published_at: string | null;
  effective_from: string | null;
  last_updated: string | null;
  version: number;
}

export interface NewsItem {
  id: string;
  title: string;
  summary: string;
  url: string;
  category: string;
}

export interface NewsSummary {
  id: string;
  title: string;
  summary: string;
}

export interface NewsFilters {
  q?: string | null;
  country?: string | null;
  category?: string | null;
  language?: string;
  size?: number;
  page?: string | null;
}

export interface NewsArticle {
  article_id?: string;
  title?: string;
  description?: string;
  link?: string;
  source_name?: string;
  source_icon?: string;
  image_url?: string | null;
  pubDate?: string;
  pubDateTZ?: string;
}

export interface NewsUpstreamPayload {
  status?: string;
  totalResults?: number;
  results?: NewsArticle[];
  nextPage?: string;
}

export interface NewsFetchApiResponse {
  source: string;
  request: Record<string, unknown>;
  status_code: number;
  upstream: NewsUpstreamPayload;
}

export interface AuditRecord {
  id: string;
  user_id: string;
  action: string;
  request_summary: string;
  response_summary: string;
  created_at: string | null;
}

export interface UserSettings {
  user_id: string;
  currency: string;
  locale: string;
  theme: string;
  notifications: boolean;
  risk_profile?: "conservative" | "balanced" | "aggressive";
  store_salary_files?: boolean;
  store_voice_transcripts?: boolean;
}

export interface ReadinessState {
  incomeExists: boolean;
  incomeVerified: boolean;
  expensesExists: boolean;
  goalsExists: boolean;
  forecastExists: boolean;
  scenarioActive: boolean;
  planExists: boolean;
}

/* ---- NEW: Alerts ---- */

export interface Alert {
  id: string;
  user_id: string;
  type: string;
  title: string;
  message: string;
  read: boolean;
  action_url: string;
  created_at: string | null;
}

/* ---- NEW: Chat Sessions ---- */

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  sources: Source[];
  timestamp: string | null;
}

export interface ChatSession {
  id: string;
  user_id: string;
  title: string;
  message_count: number;
  created_at: string | null;
  updated_at: string | null;
}

export interface ChatSessionDetail {
  id: string;
  user_id: string;
  title: string;
  messages: ChatMessage[];
  created_at: string | null;
  updated_at: string | null;
}
