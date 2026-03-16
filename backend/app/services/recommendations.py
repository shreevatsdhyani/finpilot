"""Recommendation service — bucket allocations from safe-to-invest calc."""

from __future__ import annotations


def compute_recommendations(
    monthly_income: float,
    monthly_expense: float,
    emergency_months: int = 6,
    existing_emergency_fund: float = 0.0,
) -> dict:
    """Calculate safe-to-invest amount and bucket allocations.

    This is a rule-based stub, not financial advice.
    """
    net = monthly_income - monthly_expense
    required_emergency = monthly_expense * emergency_months
    emergency_gap = max(0.0, required_emergency - existing_emergency_fund)

    safe_to_invest = max(0.0, net - (emergency_gap / emergency_months))
    safe_to_invest = round(safe_to_invest, 2)

    if safe_to_invest <= 0:
        buckets = [
            {"name": "Emergency Fund", "allocation_pct": 100.0, "rationale": "Build emergency fund first."}
        ]
    else:
        buckets = [
            {"name": "Emergency Fund", "allocation_pct": 20.0, "rationale": "Continue building safety net."},
            {"name": "Fixed Income", "allocation_pct": 30.0, "rationale": "Stable returns, low risk."},
            {"name": "Equities", "allocation_pct": 35.0, "rationale": "Long-term growth."},
            {"name": "Gold / Commodities", "allocation_pct": 10.0, "rationale": "Hedge against inflation."},
            {"name": "Cash / Liquid", "allocation_pct": 5.0, "rationale": "Short-term liquidity."},
        ]

    return {"safe_to_invest": safe_to_invest, "buckets": buckets}
