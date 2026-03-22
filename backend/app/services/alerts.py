"""Alert service — generates and manages financial alerts."""

from __future__ import annotations

from datetime import datetime, timezone

from pymongo.database import Database


def check_and_create_alerts(db: Database, user_id: str) -> list[dict]:
    """Scan user data and create alerts for notable conditions.

    Called after forecast generation or periodically.
    Returns newly created alerts.
    """
    alerts_coll = db["alerts"]
    new_alerts: list[dict] = []

    # --- Risk month warnings from latest forecast ---
    latest_forecast = db["forecasts"].find_one(
        {"user_id": user_id}, sort=[("_id", -1)]
    )
    if latest_forecast:
        risk_months = [
            m for m in latest_forecast.get("months", []) if m.get("risk")
        ]
        for rm in risk_months:
            # Don't duplicate
            existing = alerts_coll.find_one({
                "user_id": user_id,
                "type": "risk_month_warning",
                "title": {"$regex": rm["month"]},
            })
            if not existing:
                alert = {
                    "user_id": user_id,
                    "type": "risk_month_warning",
                    "title": f"⚠️ Risk month ahead: {rm['month']}",
                    "message": f"Projected expenses (₹{rm['projected_expenses']:,.0f}) exceed income (₹{rm['projected_income']:,.0f}) in {rm['month']}. Net: ₹{rm['net']:,.0f}",
                    "read": False,
                    "action_url": "/cashflow",
                    "created_at": datetime.now(timezone.utc).isoformat(),
                }
                result = alerts_coll.insert_one(alert)
                alert["_id"] = result.inserted_id
                new_alerts.append(alert)

    # --- Goal deadline warnings ---
    goals = list(db["goals"].find({"user_id": user_id}))
    now = datetime.now(timezone.utc)
    for goal in goals:
        deadline = goal.get("deadline")
        if not deadline:
            continue
        try:
            dl = datetime.fromisoformat(deadline.replace("Z", "+00:00"))
        except (ValueError, AttributeError):
            continue
        days_left = (dl - now).days
        if 0 < days_left <= 30:
            existing = alerts_coll.find_one({
                "user_id": user_id,
                "type": "goal_deadline",
                "title": {"$regex": goal["title"]},
            })
            if not existing:
                alert = {
                    "user_id": user_id,
                    "type": "goal_deadline",
                    "title": f"🎯 Goal deadline approaching: {goal['title']}",
                    "message": f"Your goal \"{goal['title']}\" (₹{goal.get('target_amount', 0):,.0f}) deadline is in {days_left} days.",
                    "read": False,
                    "action_url": "/cashflow?tab=goals",
                    "created_at": datetime.now(timezone.utc).isoformat(),
                }
                result = alerts_coll.insert_one(alert)
                alert["_id"] = result.inserted_id
                new_alerts.append(alert)

    return new_alerts
