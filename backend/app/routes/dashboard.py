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

    # sum income from verified salary docs — prefer total_monthly_income, fall back to net_take_home / net_salary
    salaries = list(db["salary_docs"].find({"user_id": user_id, "status": "verified"}))
    total_income = 0.0
    for s in salaries:
        ext = s.get("extracted", {})
        income = ext.get("total_monthly_income") or ext.get("net_take_home") or ext.get("net_salary") or 0
        total_income += income

    # Normalize expenses to monthly amounts based on frequency
    freq_divisors = {"monthly": 1, "quarterly": 3, "semi-annual": 6, "annual": 12}
    total_expenses = 0.0
    for e in expenses:
        freq = e.get("frequency", "monthly")
        divisor = freq_divisors.get(freq, 1)
        total_expenses += e.get("amount", 0) / divisor

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
