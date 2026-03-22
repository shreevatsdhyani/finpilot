"""Policy routes — curated financial policies with search & category filter."""

from __future__ import annotations

import re
from bson import ObjectId
from fastapi import APIRouter, Depends, HTTPException, Query

from app.core.security import get_current_user_id
from app.db.mongo import get_db
from app.models.policy import PolicyOut

router = APIRouter(prefix="/v1/policies", tags=["policies"])


def _doc_to_policy(d: dict) -> PolicyOut:
    return PolicyOut(
        id=str(d["_id"]),
        title=d.get("title", ""),
        summary=d.get("summary", ""),
        body=d.get("body", ""),
        category=d.get("category", ""),
        tags=d.get("tags", []),
        region=d.get("region", "India"),
        source_url=d.get("source_url"),
        source_name=d.get("source_name"),
        published_at=d.get("published_at"),
        effective_from=d.get("effective_from"),
        last_updated=d.get("last_updated"),
        version=d.get("version", 1),
    )


@router.get("", response_model=list[PolicyOut])
def list_policies(
    user_id: str = Depends(get_current_user_id),
    category: str | None = Query(None, description="Filter by category slug"),
    q: str | None = Query(None, description="Full-text search on title/summary/body"),
):
    db = get_db()
    query: dict = {}
    if category:
        query["category"] = category
    if q:
        regex = re.compile(re.escape(q), re.IGNORECASE)
        query["$or"] = [
            {"title": {"$regex": regex}},
            {"summary": {"$regex": regex}},
            {"body": {"$regex": regex}},
            {"tags": {"$regex": regex}},
        ]
    docs = db["policies"].find(query).sort("title", 1)
    return [_doc_to_policy(d) for d in docs]


@router.get("/categories", response_model=list[str])
def list_categories(user_id: str = Depends(get_current_user_id)):
    """Return distinct category values."""
    db = get_db()
    cats = db["policies"].distinct("category")
    return sorted(cats)


@router.get("/{policy_id}", response_model=PolicyOut)
def get_policy(policy_id: str, user_id: str = Depends(get_current_user_id)):
    db = get_db()
    doc = db["policies"].find_one({"_id": ObjectId(policy_id)})
    if not doc:
        raise HTTPException(status_code=404, detail="Policy not found")
    return _doc_to_policy(doc)


@router.post("/{policy_id}/subscribe")
def subscribe_policy(policy_id: str, user_id: str = Depends(get_current_user_id)):
    db = get_db()
    doc = db["policies"].find_one({"_id": ObjectId(policy_id)})
    if not doc:
        raise HTTPException(status_code=404, detail="Policy not found")
    # Upsert subscription
    db["policy_subscriptions"].update_one(
        {"user_id": user_id, "policy_id": policy_id},
        {"$set": {"user_id": user_id, "policy_id": policy_id, "active": True}},
        upsert=True,
    )
    return {"message": "Subscribed", "policy_id": policy_id, "user_id": user_id}
