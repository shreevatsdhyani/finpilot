"""Recommendation routes."""

from __future__ import annotations

from datetime import datetime, timezone

from bson import ObjectId
from fastapi import APIRouter, Depends, HTTPException

from app.core.security import get_current_user_id
from app.db.mongo import get_db
from app.models.recommendation import RecommendationOut
from app.services.audit import write_audit
from app.services.recommendations import compute_recommendations

router = APIRouter(prefix="/v1/recommendations", tags=["recommendations"])


def _doc_to_out(d: dict) -> RecommendationOut:
    return RecommendationOut(
        id=str(d["_id"]),
        user_id=d["user_id"],
        safe_to_invest=d["safe_to_invest"],
        buckets=d["buckets"],
        created_at=d.get("created_at"),
    )


@router.post("/generate", response_model=RecommendationOut, status_code=201)
def generate_recommendation(user_id: str = Depends(get_current_user_id)):
    db = get_db()
    salaries = list(db["salary_docs"].find({"user_id": user_id, "status": "verified"}))
    expenses_docs = list(db["expenses"].find({"user_id": user_id}))
    avg_income = sum(s.get("extracted", {}).get("net_salary", 0) for s in salaries) / max(len(salaries), 1) if salaries else 70000
    avg_expense = sum(e.get("amount", 0) for e in expenses_docs) / max(len(expenses_docs), 1) if expenses_docs else 42000

    rec = compute_recommendations(avg_income, avg_expense)
    doc = {
        "user_id": user_id,
        "safe_to_invest": rec["safe_to_invest"],
        "buckets": rec["buckets"],
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    result = db["recommendations"].insert_one(doc)
    doc["_id"] = result.inserted_id

    # audit
    write_audit(db, user_id, "recommendation_generate", "Generated investment recommendations", f"safe_to_invest={rec['safe_to_invest']}")

    return _doc_to_out(doc)


@router.get("", response_model=list[RecommendationOut])
def list_recommendations(user_id: str = Depends(get_current_user_id)):
    db = get_db()
    docs = db["recommendations"].find({"user_id": user_id}).sort("_id", -1).limit(10)
    return [_doc_to_out(d) for d in docs]


@router.get("/{rec_id}", response_model=RecommendationOut)
def get_recommendation(rec_id: str, user_id: str = Depends(get_current_user_id)):
    db = get_db()
    doc = db["recommendations"].find_one({"_id": ObjectId(rec_id), "user_id": user_id})
    if not doc:
        raise HTTPException(status_code=404, detail="Recommendation not found")
    return _doc_to_out(doc)
