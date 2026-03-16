"""Audit service — writes audit records to MongoDB."""

from __future__ import annotations

from datetime import datetime, timezone

from bson import ObjectId
from pymongo.database import Database


def write_audit(
    db: Database,
    user_id: str,
    action: str,
    request_summary: str = "",
    response_summary: str = "",
) -> str:
    """Insert an audit record and return its id as string."""
    doc = {
        "user_id": user_id,
        "action": action,
        "request_summary": request_summary,
        "response_summary": response_summary,
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    result = db["audits"].insert_one(doc)
    return str(result.inserted_id)
