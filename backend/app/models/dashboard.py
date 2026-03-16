"""Dashboard schemas."""

from __future__ import annotations

from pydantic import BaseModel


class DashboardSummary(BaseModel):
    total_income: float = 0.0
    total_expenses: float = 0.0
    net_savings: float = 0.0
    active_goals: int = 0
    risk_months: int = 0
    salary_docs_count: int = 0
