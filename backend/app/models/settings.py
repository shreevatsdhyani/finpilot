"""Settings schemas."""

from __future__ import annotations

from pydantic import BaseModel


class SettingsIn(BaseModel):
    currency: str = "INR"
    locale: str = "en-IN"
    theme: str = "system"
    notifications: bool = True
    risk_profile: str | None = "balanced"  # conservative | balanced | aggressive
    store_salary_files: bool = True
    store_voice_transcripts: bool = True


class SettingsOut(BaseModel):
    user_id: str
    currency: str = "INR"
    locale: str = "en-IN"
    theme: str = "system"
    notifications: bool = True
    risk_profile: str | None = "balanced"
    store_salary_files: bool = True
    store_voice_transcripts: bool = True
