"""Policy routes."""

from __future__ import annotations

from bson import ObjectId
from fastapi import APIRouter, Depends, HTTPException

from app.core.security import get_current_user_id
from app.db.mongo import get_db
from app.models.policy import PolicyOut

router = APIRouter(prefix="/v1/policies", tags=["policies"])


@router.get("", response_model=list[PolicyOut])
def list_policies(user_id: str = Depends(get_current_user_id)):
    db = get_db()
    docs = db["policies"].find()
    return [PolicyOut(id=str(d["_id"]), title=d["title"], body=d["body"], category=d.get("category", "")) for d in docs]


@router.get("/{policy_id}", response_model=PolicyOut)
def get_policy(policy_id: str, user_id: str = Depends(get_current_user_id)):
    db = get_db()
    doc = db["policies"].find_one({"_id": ObjectId(policy_id)})
    if not doc:
        raise HTTPException(status_code=404, detail="Policy not found")
    return PolicyOut(id=str(doc["_id"]), title=doc["title"], body=doc["body"], category=doc.get("category", ""))


@router.post("/{policy_id}/subscribe")
def subscribe_policy(policy_id: str, user_id: str = Depends(get_current_user_id)):
    db = get_db()
    doc = db["policies"].find_one({"_id": ObjectId(policy_id)})
    if not doc:
        raise HTTPException(status_code=404, detail="Policy not found")
    # stub — just acknowledge
    return {"message": "Subscribed", "policy_id": policy_id, "user_id": user_id}
