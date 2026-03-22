"""Alert routes."""

from __future__ import annotations

from bson import ObjectId
from fastapi import APIRouter, Depends

from app.core.security import get_current_user_id
from app.db.mongo import get_db
from app.models.alerts import AlertOut
from app.services.alerts import check_and_create_alerts

router = APIRouter(prefix="/v1/alerts", tags=["alerts"])


def _doc_to_out(doc: dict) -> AlertOut:
    return AlertOut(
        id=str(doc["_id"]),
        user_id=doc["user_id"],
        type=doc.get("type", "info"),
        title=doc.get("title", ""),
        message=doc.get("message", ""),
        read=doc.get("read", False),
        action_url=doc.get("action_url", ""),
        created_at=doc.get("created_at"),
    )


@router.get("", response_model=list[AlertOut])
def list_alerts(user_id: str = Depends(get_current_user_id)):
    db = get_db()
    # Auto-check for new alerts
    check_and_create_alerts(db, user_id)
    docs = db["alerts"].find({"user_id": user_id}).sort("_id", -1).limit(50)
    return [_doc_to_out(d) for d in docs]


@router.get("/unread-count")
def unread_count(user_id: str = Depends(get_current_user_id)):
    db = get_db()
    count = db["alerts"].count_documents({"user_id": user_id, "read": False})
    return {"count": count}


@router.post("/{alert_id}/read")
def mark_read(alert_id: str, user_id: str = Depends(get_current_user_id)):
    db = get_db()
    db["alerts"].update_one(
        {"_id": ObjectId(alert_id), "user_id": user_id},
        {"$set": {"read": True}},
    )
    return {"message": "Marked as read"}


@router.post("/read-all")
def mark_all_read(user_id: str = Depends(get_current_user_id)):
    db = get_db()
    db["alerts"].update_many(
        {"user_id": user_id, "read": False},
        {"$set": {"read": True}},
    )
    return {"message": "All alerts marked as read"}
