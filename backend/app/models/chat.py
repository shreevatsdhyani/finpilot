"""Chat session & message schemas."""

from __future__ import annotations

from pydantic import BaseModel, Field


class ChatMessageIn(BaseModel):
    content: str


class ChatMessage(BaseModel):
    role: str  # user | assistant
    content: str
    sources: list[dict] = Field(default_factory=list)
    timestamp: str | None = None


class ChatSessionOut(BaseModel):
    id: str
    user_id: str
    title: str = "New conversation"
    message_count: int = 0
    created_at: str | None = None
    updated_at: str | None = None


class ChatSessionDetail(BaseModel):
    id: str
    user_id: str
    title: str = "New conversation"
    messages: list[ChatMessage] = Field(default_factory=list)
    created_at: str | None = None
    updated_at: str | None = None
