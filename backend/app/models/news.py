"""News schemas — NewsData.io free plan."""

from __future__ import annotations

from typing import Any

from pydantic import BaseModel, Field


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


class NewsFetchRequest(BaseModel):
    q: str | None = Field(
        default=None,
        description=(
            "Keyword search. Supports AND / OR / NOT logic, e.g. 'stock market AND india'. "
            "Max 100 characters on free plan."
        ),
    )
    country: str | None = Field(
        default=None,
        description=(
            "Comma-separated ISO country codes, e.g. 'in' for India. "
            "Leave blank for global. Free plan: up to 5 countries."
        ),
    )
    category: str | None = Field(
        default=None,
        description=(
            "Comma-separated categories. "
            "Options: top, business, technology, science, sports, health, entertainment, world."
        ),
    )
    domain: str | None = Field(
        default=None,
        description=(
            "Comma-separated domain whitelist, e.g. "
            "'economictimes.indiatimes.com,moneycontrol.com'. "
            "Free plan: up to 5 domains."
        ),
    )
    language: str = Field(
        default="en",
        description="Language code, e.g. 'en'. Defaults to English.",
    )
    size: int = Field(
        default=10,
        ge=1,
        le=10,
        description="Number of articles per request. Free plan: 1–10.",
    )
    page: str | None = Field(
        default=None,
        description=(
            "Pagination token. Copy the 'nextPage' value from a previous response "
            "to fetch the next page of results."
        ),
    )

    model_config = {
        "json_schema_extra": {
            "example": {
                "q": "stock market AND india",
                "country": "in",
                "category": "business",
                "domain": "economictimes.indiatimes.com,moneycontrol.com",
                "language": "en",
                "size": 10,
            }
        }
    }


class NewsFetchResponse(BaseModel):
    source: str
    request: dict[str, Any]
    status_code: int
    upstream: dict[str, Any]