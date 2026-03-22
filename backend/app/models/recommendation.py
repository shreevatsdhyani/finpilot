"""Recommendation schemas."""

from __future__ import annotations

from pydantic import BaseModel, Field


class Bucket(BaseModel):
    name: str  # e.g. "Emergency Fund", "Equities", "Fixed Income"
    allocation_pct: float
    allocation_amount: float = 0.0
    rationale: str = ""
    instruments: list[str] = Field(default_factory=list)


class RecommendationOut(BaseModel):
    id: str
    user_id: str
    safe_to_invest: float
    risk_profile: str = "moderate"  # conservative | moderate | aggressive
    buckets: list[Bucket]
    inputs_snapshot: dict = Field(default_factory=dict)
    created_at: str | None = None
