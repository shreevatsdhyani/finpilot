"""Forecast schemas."""

from __future__ import annotations

from pydantic import BaseModel


class ForecastRequest(BaseModel):
    horizon: int = 3  # months: 3 | 6 | 12


class ForecastMonth(BaseModel):
    month: str  # e.g. "2026-03"
    projected_income: float
    projected_expenses: float
    net: float
    risk: bool = False  # True if net < 0


class ForecastOut(BaseModel):
    id: str
    user_id: str
    horizon: int
    months: list[ForecastMonth]
    created_at: str | None = None
