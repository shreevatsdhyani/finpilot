"""Expense & Goal schemas."""

from __future__ import annotations

from pydantic import BaseModel, Field


class ExpenseIn(BaseModel):
    category: str
    amount: float
    description: str = ""
    date: str | None = None  # ISO date string


class ExpenseOut(BaseModel):
    id: str
    user_id: str
    category: str
    amount: float
    description: str = ""
    date: str | None = None


class GoalIn(BaseModel):
    title: str
    target_amount: float
    deadline: str | None = None  # ISO date
    priority: str = "medium"  # low | medium | high


class GoalOut(BaseModel):
    id: str
    user_id: str
    title: str
    target_amount: float
    deadline: str | None = None
    priority: str = "medium"
