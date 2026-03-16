"""News schemas."""

from __future__ import annotations

from pydantic import BaseModel


class NewsOut(BaseModel):
    id: str
    title: str
    summary: str = ""
    url: str = ""
    category: str = ""


class NewsSummarizeOut(BaseModel):
    id: str
    title: str
    summary: str
