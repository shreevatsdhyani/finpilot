"""Dashboard routes."""

from __future__ import annotations

from fastapi import APIRouter, Depends

from app.core.security import get_current_user_id
from app.db.mongo import get_db
from app.models.dashboard import DashboardSummary

router = APIRouter(prefix="/v1/dashboard", tags=["dashboard"])


@router.get("/summary", response_model=DashboardSummary)
def dashboard_summary(user_id: str = Depends(get_current_user_id)):
    db = get_db()
    salary_docs = db["salary_docs"].count_documents({"user_id": user_id})
    expenses = list(db["expenses"].find({"user_id": user_id}))
    goals = db["goals"].count_documents({"user_id": user_id})
    total_expenses = sum(e.get("amount", 0) for e in expenses)

    # sum net_salary from verified salary docs
    salaries = list(db["salary_docs"].find({"user_id": user_id, "status": "verified"}))
    total_income = sum(s.get("extracted", {}).get("net_salary", 0) for s in salaries)

    # risk months from latest forecast
    latest_forecast = db["forecasts"].find_one({"user_id": user_id}, sort=[("_id", -1)])
    risk_months = 0
    if latest_forecast:
        risk_months = sum(1 for m in latest_forecast.get("months", []) if m.get("risk"))

    return DashboardSummary(
        total_income=total_income,
        total_expenses=total_expenses,
        net_savings=total_income - total_expenses,
        active_goals=goals,
        risk_months=risk_months,
        salary_docs_count=salary_docs,
    )
