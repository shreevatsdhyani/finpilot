"""Recommendation schemas."""

from __future__ import annotations

from pydantic import BaseModel


class Bucket(BaseModel):
    name: str  # e.g. "Emergency Fund", "Equities", "Fixed Income"
    allocation_pct: float
    rationale: str = ""


class RecommendationOut(BaseModel):
    id: str
    user_id: str
    safe_to_invest: float
    buckets: list[Bucket]
    created_at: str | None = None
