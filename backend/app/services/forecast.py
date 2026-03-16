"""Forecast service — simple arithmetic projection."""

from __future__ import annotations

from datetime import datetime, timezone
from dateutil.relativedelta import relativedelta


def generate_forecast(
    avg_income: float,
    avg_expense: float,
    horizon: int,
) -> list[dict]:
    """Project income/expense for *horizon* months using simple linear model.

    Risk month = any month where projected expenses exceed income.
    """
    now = datetime.now(timezone.utc)
    months: list[dict] = []
    for i in range(1, horizon + 1):
        future = now + relativedelta(months=i)
        # Add a small random-ish seasonal bump
        seasonal_factor = 1.0 + (0.02 if future.month in (3, 9, 12) else 0.0)
        proj_income = round(avg_income * seasonal_factor, 2)
        proj_expense = round(avg_expense * (1 + 0.01 * i), 2)  # slight growth
        net = round(proj_income - proj_expense, 2)
        months.append(
            {
                "month": future.strftime("%Y-%m"),
                "projected_income": proj_income,
                "projected_expenses": proj_expense,
                "net": net,
                "risk": net < 0,
            }
        )
    return months
