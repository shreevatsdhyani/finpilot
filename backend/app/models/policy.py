"""Policy schemas."""

from __future__ import annotations

from pydantic import BaseModel


class PolicyOut(BaseModel):
    id: str
    title: str
    body: str
    category: str = ""
