"""Alert schemas."""

from __future__ import annotations

from pydantic import BaseModel, Field


class AlertOut(BaseModel):
    id: str
    user_id: str
    type: str  # risk_month_warning | goal_deadline | policy_update | news_impact
    title: str
    message: str
    read: bool = False
    action_url: str = ""
    created_at: str | None = None
