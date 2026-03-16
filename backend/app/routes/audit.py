"""Audit routes."""

from __future__ import annotations

from bson import ObjectId
from fastapi import APIRouter, Depends, HTTPException

from app.core.security import get_current_user_id
from app.db.mongo import get_db
from app.models.audit import AuditOut

router = APIRouter(prefix="/v1/audit", tags=["audit"])


@router.get("", response_model=list[AuditOut])
def list_audits(user_id: str = Depends(get_current_user_id)):
    db = get_db()
    docs = db["audits"].find({"user_id": user_id}).sort("_id", -1).limit(50)
    return [
        AuditOut(
            id=str(d["_id"]),
            user_id=d["user_id"],
            action=d["action"],
            request_summary=d.get("request_summary", ""),
            response_summary=d.get("response_summary", ""),
            created_at=d.get("created_at"),
        )
        for d in docs
    ]


@router.get("/{audit_id}", response_model=AuditOut)
def get_audit(audit_id: str, user_id: str = Depends(get_current_user_id)):
    db = get_db()
    doc = db["audits"].find_one({"_id": ObjectId(audit_id), "user_id": user_id})
    if not doc:
        raise HTTPException(status_code=404, detail="Audit record not found")
    return AuditOut(
        id=str(doc["_id"]),
        user_id=doc["user_id"],
        action=doc["action"],
        request_summary=doc.get("request_summary", ""),
        response_summary=doc.get("response_summary", ""),
        created_at=doc.get("created_at"),
    )
