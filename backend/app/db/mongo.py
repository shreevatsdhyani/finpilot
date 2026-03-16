"""MongoDB client & helpers."""

from __future__ import annotations

from pymongo import MongoClient
from pymongo.database import Database

from app.core.config import settings

_client: MongoClient | None = None


def get_client() -> MongoClient:
    global _client
    if _client is None:
        _client = MongoClient(settings.MONGO_URI)
    return _client


def get_db() -> Database:
    return get_client()[settings.MONGO_DB]


def seed_policies(db: Database) -> None:
    """Insert a small policy corpus for the RAG stub if empty."""
    coll = db["policies"]
    if coll.count_documents({}) == 0:
        coll.insert_many(
            [
                {
                    "title": "Emergency Fund Policy",
                    "body": "Maintain at least 6 months of essential expenses in a liquid savings account before allocating to higher-risk investments.",
                    "category": "savings",
                },
                {
                    "title": "Debt Repayment Priority",
                    "body": "Prioritise paying off high-interest debt (>8 % APR) before investing surplus income.",
                    "category": "debt",
                },
                {
                    "title": "Diversification Guideline",
                    "body": "Spread investments across at least three asset classes: equities, fixed income, and cash equivalents.",
                    "category": "investment",
                },
                {
                    "title": "Insurance Adequacy",
                    "body": "Ensure term life cover equals at least 10x annual income. Health insurance should cover the whole family.",
                    "category": "insurance",
                },
                {
                    "title": "Tax-Advantaged Accounts",
                    "body": "Maximise contributions to tax-advantaged retirement accounts (e.g., 401k, PPF, NPS) before taxable investments.",
                    "category": "tax",
                },
            ]
        )


def seed_news(db: Database) -> None:
    """Insert sample news items if the collection is empty."""
    coll = db["news"]
    if coll.count_documents({}) == 0:
        coll.insert_many(
            [
                {
                    "title": "RBI holds repo rate steady at 6.5 %",
                    "summary": "The Reserve Bank of India maintained the repo rate, signalling stable monetary policy.",
                    "url": "https://example.com/rbi-rate",
                    "category": "macro",
                },
                {
                    "title": "Equity markets hit all-time high",
                    "summary": "Benchmark indices surged 2 % on strong FII inflows.",
                    "url": "https://example.com/markets-high",
                    "category": "markets",
                },
            ]
        )
