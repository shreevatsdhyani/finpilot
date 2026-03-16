"""Scenario service — apply adjustments to forecast."""

from __future__ import annotations


def apply_scenario(
    base_income: float,
    base_expense: float,
    adjustments: dict,
    horizon: int = 6,
) -> dict:
    """Apply percentage adjustments and return a quick projection summary."""
    income_change = adjustments.get("income_change_pct", 0) / 100
    expense_change = adjustments.get("expense_change_pct", 0) / 100

    adj_income = round(base_income * (1 + income_change), 2)
    adj_expense = round(base_expense * (1 + expense_change), 2)
    net = round(adj_income - adj_expense, 2)

    return {
        "adjusted_monthly_income": adj_income,
        "adjusted_monthly_expense": adj_expense,
        "monthly_net": net,
        "horizon": horizon,
        "projected_savings": round(net * horizon, 2),
        "risk": net < 0,
    }
