"""RAG assistant & voice schemas."""

from __future__ import annotations

from pydantic import BaseModel, Field


class AssistantQuery(BaseModel):
    query: str


class Source(BaseModel):
    title: str
    snippet: str


class AssistantResponse(BaseModel):
    answer: str
    sources: list[Source] = Field(default_factory=list)
    audit_id: str = ""


class VoiceQuery(BaseModel):
    text: str  # STT transcript (or typed text for now)
    audio_base64: str | None = None  # reserved for future audio upload


class VoiceResponse(BaseModel):
    transcript_text: str
    answer_text: str
    tts_url: str = ""  # empty for now
    sources: list[Source] = Field(default_factory=list)
    audit_id: str = ""
