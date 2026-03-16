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

export interface Expense {
  id: string;
  user_id: string;
  category: string;
  amount: number;
  description: string;
  date: string | null;
}

export interface Goal {
  id: string;
  user_id: string;
  title: string;
  target_amount: number;
  deadline: string | null;
  priority: "low" | "medium" | "high";
}

export interface ForecastMonth {
  month: string;
  projected_income: number;
  projected_expenses: number;
  net: number;
  risk: boolean;
}

export interface Forecast {
  id: string;
  user_id: string;
  horizon: number;
  months: ForecastMonth[];
  created_at: string | null;
}

export interface Scenario {
  id: string;
  user_id: string;
  name: string;
  description: string;
  adjustments: Record<string, number>;
  active: boolean;
  result: Record<string, unknown> | null;
}

export interface ScenarioCompare {
  scenarios: Scenario[];
}

export interface Bucket {
  name: string;
  allocation_pct: number;
  rationale: string;
}

export interface Recommendation {
  id: string;
  user_id: string;
  safe_to_invest: number;
  buckets: Bucket[];
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
  body: string;
  category: string;
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
}
