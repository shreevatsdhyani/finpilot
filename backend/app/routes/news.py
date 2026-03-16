"""News routes."""

from __future__ import annotations

from bson import ObjectId
from fastapi import APIRouter, Depends, HTTPException

from app.core.security import get_current_user_id
from app.db.mongo import get_db
from app.models.news import NewsOut, NewsSummarizeOut

router = APIRouter(prefix="/v1/news", tags=["news"])


@router.get("", response_model=list[NewsOut])
def list_news(user_id: str = Depends(get_current_user_id)):
    db = get_db()
    docs = db["news"].find().sort("_id", -1)
    return [
        NewsOut(id=str(d["_id"]), title=d["title"], summary=d.get("summary", ""), url=d.get("url", ""), category=d.get("category", ""))
        for d in docs
    ]


@router.get("/{news_id}", response_model=NewsOut)
def get_news(news_id: str, user_id: str = Depends(get_current_user_id)):
    db = get_db()
    doc = db["news"].find_one({"_id": ObjectId(news_id)})
    if not doc:
        raise HTTPException(status_code=404, detail="News not found")
    return NewsOut(id=str(doc["_id"]), title=doc["title"], summary=doc.get("summary", ""), url=doc.get("url", ""), category=doc.get("category", ""))


@router.post("/{news_id}/summarize", response_model=NewsSummarizeOut)
def summarize_news(news_id: str, user_id: str = Depends(get_current_user_id)):
    db = get_db()
    doc = db["news"].find_one({"_id": ObjectId(news_id)})
    if not doc:
        raise HTTPException(status_code=404, detail="News not found")
    # stub: return existing summary or a fixed one
    summary = doc.get("summary", "No summary available.")
    return NewsSummarizeOut(id=str(doc["_id"]), title=doc["title"], summary=summary)
