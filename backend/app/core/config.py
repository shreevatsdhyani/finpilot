"""FinPilot backend core configuration — loads from .env."""

from __future__ import annotations

import os
from pathlib import Path

from dotenv import load_dotenv

_env_path = Path(__file__).resolve().parents[2] / ".env"
load_dotenv(_env_path)


class Settings:
    MONGO_URI: str = os.getenv("MONGO_URI", "mongodb://localhost:27017")
    MONGO_DB: str = os.getenv("MONGO_DB", "finpilot")
    MONGO_SERVER_SELECTION_TIMEOUT_MS: int = int(
        os.getenv("MONGO_SERVER_SELECTION_TIMEOUT_MS", "3000")
    )
    MONGO_MOCK_FALLBACK: bool = os.getenv("MONGO_MOCK_FALLBACK", "true").lower() in {
        "1",
        "true",
        "yes",
        "on",
    }
    JWT_SECRET: str = os.getenv("JWT_SECRET", "change_me")
    JWT_EXPIRES_MIN: int = int(os.getenv("JWT_EXPIRES_MIN", "60"))
    # Comma-separated pairs: access_id:access_password
    AUTH_ACCESS_CREDENTIALS: str = os.getenv("AUTH_ACCESS_CREDENTIALS", "")

    # NewsData.io
    NEWSDATA_API_KEY: str = os.getenv("NEWSDATA_API_KEY", "")
    NEWSDATA_API_BASE_URL: str = os.getenv(
        "NEWSDATA_API_BASE_URL", "https://newsdata.io/api/1/latest"
    )
    NEWSDATA_DEFAULT_DOMAINS: str = os.getenv(
        "NEWSDATA_DEFAULT_DOMAINS",
        "economictimes.indiatimes.com,reuters.com,bloomberg.com,moneycontrol.com",
    )
    NEWSDATA_DEFAULT_COUNTRIES: str = os.getenv("NEWSDATA_DEFAULT_COUNTRIES", "in,global")
    NEWSDATA_DEFAULT_CATEGORY: str = os.getenv("NEWSDATA_DEFAULT_CATEGORY", "business")

    CORS_ORIGINS: list[str] = [
        o.strip() for o in os.getenv("CORS_ORIGINS", "http://localhost:3000").split(",")
    ]


settings = Settings()