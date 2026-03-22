"""Recommendation service — risk-profiled bucket allocations."""

from __future__ import annotations


# Allocation profiles indexed by risk tolerance
PROFILES = {
    "conservative": [
        {"name": "Emergency Fund", "allocation_pct": 30.0, "rationale": "Prioritise safety net.", "instruments": ["Savings Account", "Liquid Fund"]},
        {"name": "Fixed Income", "allocation_pct": 40.0, "rationale": "Stable, predictable returns.", "instruments": ["FD", "PPF", "Debt Mutual Fund"]},
        {"name": "Equities", "allocation_pct": 15.0, "rationale": "Moderate long-term growth.", "instruments": ["Large Cap Index Fund"]},
        {"name": "Gold / Commodities", "allocation_pct": 10.0, "rationale": "Inflation hedge.", "instruments": ["Sovereign Gold Bond", "Gold ETF"]},
        {"name": "Cash / Liquid", "allocation_pct": 5.0, "rationale": "Short-term liquidity.", "instruments": ["Savings Account"]},
    ],
    "moderate": [
        {"name": "Emergency Fund", "allocation_pct": 20.0, "rationale": "Continue building safety net.", "instruments": ["Savings Account", "Liquid Fund"]},
        {"name": "Fixed Income", "allocation_pct": 30.0, "rationale": "Stable returns, low risk.", "instruments": ["FD", "PPF", "Debt Mutual Fund"]},
        {"name": "Equities", "allocation_pct": 35.0, "rationale": "Long-term growth via diversification.", "instruments": ["Nifty 50 Index Fund", "Flexi Cap MF"]},
        {"name": "Gold / Commodities", "allocation_pct": 10.0, "rationale": "Inflation hedge.", "instruments": ["Sovereign Gold Bond", "Gold ETF"]},
        {"name": "Cash / Liquid", "allocation_pct": 5.0, "rationale": "Short-term liquidity.", "instruments": ["Savings Account"]},
    ],
    "aggressive": [
        {"name": "Emergency Fund", "allocation_pct": 10.0, "rationale": "Minimal safety net maintained.", "instruments": ["Liquid Fund"]},
        {"name": "Fixed Income", "allocation_pct": 15.0, "rationale": "Some stability.", "instruments": ["Short Duration Debt Fund"]},
        {"name": "Equities", "allocation_pct": 55.0, "rationale": "Maximise long-term growth.", "instruments": ["Nifty 50 Index", "Mid Cap Fund", "Small Cap Fund", "Flexi Cap"]},
        {"name": "Gold / Commodities", "allocation_pct": 10.0, "rationale": "Inflation and volatility hedge.", "instruments": ["Gold ETF"]},
        {"name": "Cash / Liquid", "allocation_pct": 10.0, "rationale": "Opportunity fund for market dips.", "instruments": ["Liquid Fund"]},
    ],
}


def compute_recommendations(
    monthly_income: float,
    monthly_expense: float,
    risk_profile: str = "moderate",
    emergency_months: int = 6,
    existing_emergency_fund: float = 0.0,
) -> dict:
    """Calculate safe-to-invest amount and bucket allocations with amounts.

    This is a rule-based engine, not financial advice.
    """
    if risk_profile not in PROFILES:
        risk_profile = "moderate"

    net = monthly_income - monthly_expense
    required_emergency = monthly_expense * emergency_months
    emergency_gap = max(0.0, required_emergency - existing_emergency_fund)

    safe_to_invest = max(0.0, net - (emergency_gap / emergency_months))
    safe_to_invest = round(safe_to_invest, 2)

    if safe_to_invest <= 0:
        buckets = [
            {
                "name": "Emergency Fund",
                "allocation_pct": 100.0,
                "allocation_amount": round(max(net, 0), 2),
                "rationale": "Build emergency fund first — current gap: ₹{:,.0f}".format(emergency_gap),
                "instruments": ["Savings Account", "Liquid Fund"],
            }
        ]
    else:
        profile_buckets = PROFILES[risk_profile]
        buckets = []
        for b in profile_buckets:
            amount = round(safe_to_invest * b["allocation_pct"] / 100, 2)
            buckets.append({
                "name": b["name"],
                "allocation_pct": b["allocation_pct"],
                "allocation_amount": amount,
                "rationale": b["rationale"],
                "instruments": b["instruments"],
            })

    inputs_snapshot = {
        "monthly_income": monthly_income,
        "monthly_expense": monthly_expense,
        "emergency_fund_current": existing_emergency_fund,
        "emergency_target": round(required_emergency, 2),
        "emergency_gap": round(emergency_gap, 2),
        "risk_profile": risk_profile,
    }

    return {
        "safe_to_invest": safe_to_invest,
        "risk_profile": risk_profile,
        "buckets": buckets,
        "inputs_snapshot": inputs_snapshot,
    }
