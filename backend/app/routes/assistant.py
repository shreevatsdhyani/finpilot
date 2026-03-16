"""RAG assistant & voice routes (HTTP fallback)."""

from __future__ import annotations

from fastapi import APIRouter, Depends

from app.core.security import get_current_user_id
from app.db.mongo import get_db
from app.models.assistant import (
    AssistantQuery,
    AssistantResponse,
    VoiceQuery,
    VoiceResponse,
)
from app.services.audit import write_audit
from app.services.rag import answer_query

router = APIRouter(prefix="/v1", tags=["assistant"])


@router.post("/assistant/query", response_model=AssistantResponse)
def assistant_query(body: AssistantQuery, user_id: str = Depends(get_current_user_id)):
    db = get_db()
    answer, sources = answer_query(db, body.query)
    audit_id = write_audit(db, user_id, "assistant_query", body.query, answer[:200])
    return AssistantResponse(answer=answer, sources=sources, audit_id=audit_id)


@router.post("/voice/query", response_model=VoiceResponse)
def voice_query(body: VoiceQuery, user_id: str = Depends(get_current_user_id)):
    db = get_db()
    # For MVP: body.text is the transcript (no real STT)
    answer, sources = answer_query(db, body.text)
    audit_id = write_audit(db, user_id, "voice_query", body.text, answer[:200])
    return VoiceResponse(
        transcript_text=body.text,
        answer_text=answer,
        tts_url="",  # placeholder for future TTS
        sources=sources,
        audit_id=audit_id,
    )
