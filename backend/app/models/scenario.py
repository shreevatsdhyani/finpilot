"""Scenario schemas."""

from __future__ import annotations

from pydantic import BaseModel, Field


class ScenarioIn(BaseModel):
    name: str
    description: str = ""
    adjustments: dict = Field(default_factory=dict)
    # adjustments e.g. {"income_change_pct": 10, "expense_change_pct": -5}


class ScenarioOut(BaseModel):
    id: str
    user_id: str
    name: str
    description: str = ""
    adjustments: dict = Field(default_factory=dict)
    active: bool = False
    result: dict | None = None


class ScenarioCompare(BaseModel):
    scenarios: list[ScenarioOut]
