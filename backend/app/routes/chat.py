"""Chat session routes — conversation history for AI assistant."""

from __future__ import annotations

from datetime import datetime, timezone

from bson import ObjectId
from fastapi import APIRouter, Depends, HTTPException

from app.core.security import get_current_user_id
from app.db.mongo import get_db
from app.models.chat import ChatMessageIn, ChatSessionOut, ChatSessionDetail
from app.services.rag import answer_query
from app.services.audit import write_audit

router = APIRouter(prefix="/v1/chat", tags=["chat"])


@router.get("/sessions", response_model=list[ChatSessionOut])
def list_sessions(user_id: str = Depends(get_current_user_id)):
    db = get_db()
    docs = db["chat_sessions"].find({"user_id": user_id}).sort("_id", -1).limit(20)
    result = []
    for d in docs:
        result.append(ChatSessionOut(
            id=str(d["_id"]),
            user_id=d["user_id"],
            title=d.get("title", "New conversation"),
            message_count=len(d.get("messages", [])),
            created_at=d.get("created_at"),
            updated_at=d.get("updated_at"),
        ))
    return result


@router.post("/sessions", response_model=ChatSessionOut, status_code=201)
def create_session(user_id: str = Depends(get_current_user_id)):
    db = get_db()
    now = datetime.now(timezone.utc).isoformat()
    doc = {
        "user_id": user_id,
        "title": "New conversation",
        "messages": [],
        "created_at": now,
        "updated_at": now,
    }
    result = db["chat_sessions"].insert_one(doc)
    return ChatSessionOut(
        id=str(result.inserted_id),
        user_id=user_id,
        title="New conversation",
        message_count=0,
        created_at=now,
        updated_at=now,
    )


@router.get("/sessions/{session_id}", response_model=ChatSessionDetail)
def get_session(session_id: str, user_id: str = Depends(get_current_user_id)):
    db = get_db()
    doc = db["chat_sessions"].find_one(
        {"_id": ObjectId(session_id), "user_id": user_id}
    )
    if not doc:
        raise HTTPException(status_code=404, detail="Session not found")
    return ChatSessionDetail(
        id=str(doc["_id"]),
        user_id=doc["user_id"],
        title=doc.get("title", "New conversation"),
        messages=doc.get("messages", []),
        created_at=doc.get("created_at"),
        updated_at=doc.get("updated_at"),
    )


@router.post("/sessions/{session_id}/messages")
def send_message(
    session_id: str,
    body: ChatMessageIn,
    user_id: str = Depends(get_current_user_id),
):
    db = get_db()
    doc = db["chat_sessions"].find_one(
        {"_id": ObjectId(session_id), "user_id": user_id}
    )
    if not doc:
        raise HTTPException(status_code=404, detail="Session not found")

    now = datetime.now(timezone.utc).isoformat()

    # Add user message
    user_msg = {
        "role": "user",
        "content": body.content,
        "sources": [],
        "timestamp": now,
    }

    # Generate AI response via RAG
    answer, sources = answer_query(db, body.content)
    assistant_msg = {
        "role": "assistant",
        "content": answer,
        "sources": sources,
        "timestamp": now,
    }

    # Update session
    messages = doc.get("messages", [])
    messages.append(user_msg)
    messages.append(assistant_msg)

    # Auto-title from first user message
    title = doc.get("title", "New conversation")
    if title == "New conversation" and body.content:
        title = body.content[:50] + ("..." if len(body.content) > 50 else "")

    db["chat_sessions"].update_one(
        {"_id": ObjectId(session_id)},
        {"$set": {"messages": messages, "title": title, "updated_at": now}},
    )

    # Audit log
    write_audit(
        db, user_id, "assistant_query",
        request_summary=body.content[:100],
        response_summary=answer[:100],
    )

    return {
        "user_message": user_msg,
        "assistant_message": assistant_msg,
    }


@router.delete("/sessions/{session_id}", status_code=204)
def delete_session(session_id: str, user_id: str = Depends(get_current_user_id)):
    db = get_db()
    result = db["chat_sessions"].delete_one(
        {"_id": ObjectId(session_id), "user_id": user_id}
    )
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Session not found")
    return None
