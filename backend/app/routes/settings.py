"""Settings routes."""

from __future__ import annotations

from fastapi import APIRouter, Depends

from app.core.security import get_current_user_id
from app.db.mongo import get_db
from app.models.settings import SettingsIn, SettingsOut

router = APIRouter(prefix="/v1/settings", tags=["settings"])


@router.get("", response_model=SettingsOut)
def get_settings(user_id: str = Depends(get_current_user_id)):
    db = get_db()
    doc = db["settings"].find_one({"user_id": user_id})
    if not doc:
        return SettingsOut(user_id=user_id)
    return SettingsOut(
        user_id=doc["user_id"],
        currency=doc.get("currency", "INR"),
        locale=doc.get("locale", "en-IN"),
        theme=doc.get("theme", "light"),
        notifications=doc.get("notifications", True),
    )


@router.post("", response_model=SettingsOut)
def update_settings(body: SettingsIn, user_id: str = Depends(get_current_user_id)):
    db = get_db()
    update = body.model_dump()
    update["user_id"] = user_id
    db["settings"].update_one({"user_id": user_id}, {"$set": update}, upsert=True)
    return SettingsOut(**update)
