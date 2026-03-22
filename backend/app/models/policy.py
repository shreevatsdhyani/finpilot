"""Policy schemas — enriched for curated Indian finance policies."""

from __future__ import annotations

from pydantic import BaseModel


class PolicyOut(BaseModel):
    id: str
    title: str
    summary: str
    body: str
    category: str = ""
    tags: list[str] = []
    region: str = "India"
    source_url: str | None = None
    source_name: str | None = None
    published_at: str | None = None
    effective_from: str | None = None
    last_updated: str | None = None
    version: int = 1
