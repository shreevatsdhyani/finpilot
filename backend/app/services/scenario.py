"""Scenario service — month-by-month simulation with adjustments."""

from __future__ import annotations

from datetime import datetime, timezone
from dateutil.relativedelta import relativedelta


def apply_scenario(
    base_income: float,
    base_expense: float,
    adjustments: dict,
    horizon: int = 6,
) -> dict:
    """Apply adjustments and run a month-by-month simulation.

    Supported adjustments:
      - income_change_pct: percentage change to income
      - expense_change_pct: percentage change to expenses
      - new_emi: monthly EMI amount to add
      - emi_start_month: month index (1-based) when EMI starts
      - one_time_income: one-time income (added in month 1)
      - one_time_expense: one-time expense (added in month 1)
    """
    income_change = adjustments.get("income_change_pct", 0) / 100
    expense_change = adjustments.get("expense_change_pct", 0) / 100
    new_emi = adjustments.get("new_emi", 0)
    emi_start_month = adjustments.get("emi_start_month", 1)
    one_time_income = adjustments.get("one_time_income", 0)
    one_time_expense = adjustments.get("one_time_expense", 0)

    adj_income = round(base_income * (1 + income_change), 2)
    adj_expense = round(base_expense * (1 + expense_change), 2)

    now = datetime.now(timezone.utc)
    months = []
    cumulative = 0.0
    risk_count = 0

    for i in range(1, horizon + 1):
        future = now + relativedelta(months=i)
        m_income = adj_income
        m_expense = adj_expense

        # Add one-time events in first month
        if i == 1:
            m_income += one_time_income
            m_expense += one_time_expense

        # Add EMI from start month onward
        if new_emi > 0 and i >= emi_start_month:
            m_expense += new_emi

        m_income = round(m_income, 2)
        m_expense = round(m_expense, 2)
        net = round(m_income - m_expense, 2)
        cumulative = round(cumulative + net, 2)
        is_risk = net < 0
        if is_risk:
            risk_count += 1

        months.append({
            "month": future.strftime("%Y-%m"),
            "projected_income": m_income,
            "projected_expenses": m_expense,
            "net": net,
            "cumulative_savings": cumulative,
            "risk": is_risk,
        })

    total_net = round(sum(m["net"] for m in months), 2)

    return {
        "adjusted_monthly_income": adj_income,
        "adjusted_monthly_expense": adj_expense,
        "monthly_net": round(adj_income - adj_expense, 2),
        "horizon": horizon,
        "projected_savings": total_net,
        "risk_month_count": risk_count,
        "risk": any(m["risk"] for m in months),
        "months": months,
    }
