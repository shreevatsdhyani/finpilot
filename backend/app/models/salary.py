"""Salary / OCR schemas."""

from __future__ import annotations

from pydantic import BaseModel, Field


class SalaryDocOut(BaseModel):
    id: str
    user_id: str
    filename: str
    status: str = "pending"  # pending | extracted | verified
    extracted: dict | None = None
    created_at: str | None = None


class SalaryVerifyRequest(BaseModel):
    doc_id: str
    verified_fields: dict = Field(default_factory=dict)
