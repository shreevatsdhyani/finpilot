"""Audit schemas."""

from __future__ import annotations

from pydantic import BaseModel


class AuditOut(BaseModel):
    id: str
    user_id: str
    action: str  # e.g. "assistant_query", "recommendation_generate"
    request_summary: str = ""
    response_summary: str = ""
    created_at: str | None = None
