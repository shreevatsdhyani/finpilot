"""Settings schemas."""

from __future__ import annotations

from pydantic import BaseModel


class SettingsIn(BaseModel):
    currency: str = "INR"
    locale: str = "en-IN"
    theme: str = "light"
    notifications: bool = True


class SettingsOut(BaseModel):
    user_id: str
    currency: str = "INR"
    locale: str = "en-IN"
    theme: str = "light"
    notifications: bool = True
