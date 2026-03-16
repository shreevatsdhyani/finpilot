"""Forecast routes."""

from __future__ import annotations

from datetime import datetime, timezone
from typing import Optional

from bson import ObjectId
from fastapi import APIRouter, Depends, Query

from app.core.security import get_current_user_id
from app.db.mongo import get_db
from app.models.forecast import ForecastOut, ForecastRequest
from app.services.forecast import generate_forecast

router = APIRouter(prefix="/v1/forecast", tags=["forecast"])


@router.post("/generate", response_model=ForecastOut, status_code=201)
def create_forecast(body: ForecastRequest, user_id: str = Depends(get_current_user_id)):
    db = get_db()

    # Compute averages from stored data
    salaries = list(db["salary_docs"].find({"user_id": user_id, "status": "verified"}))
    expenses = list(db["expenses"].find({"user_id": user_id}))
    avg_income = (
        sum(s.get("extracted", {}).get("net_salary", 0) for s in salaries) / max(len(salaries), 1)
    )
    avg_expense = sum(e.get("amount", 0) for e in expenses) / max(len(expenses), 1) if expenses else avg_income * 0.6

    months = generate_forecast(avg_income or 70000, avg_expense or 42000, body.horizon)
    doc = {
        "user_id": user_id,
        "horizon": body.horizon,
        "months": months,
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    result = db["forecasts"].insert_one(doc)
    return ForecastOut(id=str(result.inserted_id), **doc)


@router.get("", response_model=list[ForecastOut])
def list_forecasts(
    horizon: Optional[int] = Query(None, ge=1, le=12),
    user_id: str = Depends(get_current_user_id),
):
    db = get_db()
    query: dict = {"user_id": user_id}
    if horizon is not None:
        query["horizon"] = horizon
    docs = db["forecasts"].find(query).sort("_id", -1).limit(10)
    return [ForecastOut(id=str(d["_id"]), **{k: d[k] for k in ("user_id", "horizon", "months", "created_at") if k in d}) for d in docs]
