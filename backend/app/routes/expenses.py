"""Expenses & Goals routes — enriched with market-standard parameters."""

from __future__ import annotations

from datetime import datetime, timezone
from math import ceil

from bson import ObjectId
from fastapi import APIRouter, Depends, HTTPException, status

from app.core.security import get_current_user_id
from app.db.mongo import get_db
from app.models.expenses import (
    ExpenseBulkIn,
    ExpenseIn,
    ExpenseOut,
    GoalIn,
    GoalOut,
)

router = APIRouter(prefix="/v1", tags=["expenses-goals"])


# ── Helpers ──────────────────────────────────────────────────────────


_FREQ_DIVISORS = {
    "monthly": 1,
    "quarterly": 3,
    "semi-annual": 6,
    "annual": 12,
}


def _normalize_monthly(amount: float, frequency: str) -> float:
    """Convert any frequency amount to its monthly equivalent."""
    divisor = _FREQ_DIVISORS.get(frequency, 1)
    return round(amount / divisor, 2)


def _expense_doc_to_out(doc: dict) -> ExpenseOut:
    amount = doc.get("amount", 0)
    frequency = doc.get("frequency", "monthly")
    return ExpenseOut(
        id=str(doc["_id"]),
        user_id=doc["user_id"],
        category=doc["category"],
        amount=amount,
        frequency=frequency,
        is_essential=doc.get("is_essential", True),
        is_fixed=doc.get("is_fixed", True),
        monthly_amount=_normalize_monthly(amount, frequency),
        description=doc.get("description", ""),
        date=doc.get("date"),
    )


def _months_between(from_date: datetime, to_date_str: str | None) -> int | None:
    """Return number of months between now and a deadline string."""
    if not to_date_str:
        return None
    try:
        to_date = datetime.fromisoformat(to_date_str)
        if to_date.tzinfo is None:
            to_date = to_date.replace(tzinfo=timezone.utc)
        delta = to_date - from_date
        return max(0, ceil(delta.days / 30.44))
    except (ValueError, TypeError):
        return None


def _goal_doc_to_out(doc: dict) -> GoalOut:
    target = doc.get("target_amount", 0)
    current = doc.get("current_savings", 0)
    remaining = max(0, target - current)
    now = datetime.now(timezone.utc)
    months = _months_between(now, doc.get("deadline"))
    required_monthly = round(remaining / months, 2) if months and months > 0 else None

    return GoalOut(
        id=str(doc["_id"]),
        user_id=doc["user_id"],
        category=doc.get("category", "Custom"),
        title=doc["title"],
        target_amount=target,
        current_savings=current,
        monthly_contribution=doc.get("monthly_contribution"),
        deadline=doc.get("deadline"),
        priority=doc.get("priority", "medium"),
        risk_tolerance=doc.get("risk_tolerance", "moderate"),
        flexibility=doc.get("flexibility", "flexible"),
        notes=doc.get("notes", ""),
        remaining_amount=remaining,
        months_to_deadline=months,
        required_monthly=required_monthly,
    )


# ═══════════════════════════════════════════════════════════════════════
# EXPENSES
# ═══════════════════════════════════════════════════════════════════════


@router.post("/expenses", response_model=ExpenseOut, status_code=status.HTTP_201_CREATED)
def create_expense(body: ExpenseIn, user_id: str = Depends(get_current_user_id)):
    db = get_db()
    doc = {
        "user_id": user_id,
        "category": body.category,
        "amount": body.amount,
        "frequency": body.frequency,
        "is_essential": body.is_essential,
        "is_fixed": body.is_fixed,
        "description": body.description,
        "date": body.date or datetime.now(timezone.utc).strftime("%Y-%m-%d"),
    }
    result = db["expenses"].insert_one(doc)
    doc["_id"] = result.inserted_id
    return _expense_doc_to_out(doc)


@router.post("/expenses/bulk", response_model=list[ExpenseOut], status_code=status.HTTP_201_CREATED)
def create_expenses_bulk(body: ExpenseBulkIn, user_id: str = Depends(get_current_user_id)):
    """Create multiple baseline expenses at once."""
    db = get_db()
    now_str = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    docs = []
    for expense in body.expenses:
        doc = {
            "user_id": user_id,
            "category": expense.category,
            "amount": expense.amount,
            "frequency": expense.frequency,
            "is_essential": expense.is_essential,
            "is_fixed": expense.is_fixed,
            "description": expense.description,
            "date": expense.date or now_str,
        }
        result = db["expenses"].insert_one(doc)
        doc["_id"] = result.inserted_id
        docs.append(doc)
    return [_expense_doc_to_out(d) for d in docs]


@router.get("/expenses", response_model=list[ExpenseOut])
def list_expenses(user_id: str = Depends(get_current_user_id)):
    db = get_db()
    docs = db["expenses"].find({"user_id": user_id}).sort("_id", -1)
    return [_expense_doc_to_out(d) for d in docs]


@router.delete("/expenses/{expense_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_expense(expense_id: str, user_id: str = Depends(get_current_user_id)):
    db = get_db()
    result = db["expenses"].delete_one({"_id": ObjectId(expense_id), "user_id": user_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Expense not found")
    return None


# ═══════════════════════════════════════════════════════════════════════
# GOALS
# ═══════════════════════════════════════════════════════════════════════


@router.post("/goals", response_model=GoalOut, status_code=status.HTTP_201_CREATED)
def create_goal(body: GoalIn, user_id: str = Depends(get_current_user_id)):
    db = get_db()
    doc = {
        "user_id": user_id,
        "category": body.category,
        "title": body.title,
        "target_amount": body.target_amount,
        "current_savings": body.current_savings,
        "monthly_contribution": body.monthly_contribution,
        "deadline": body.deadline,
        "priority": body.priority,
        "risk_tolerance": body.risk_tolerance,
        "flexibility": body.flexibility,
        "notes": body.notes,
    }
    result = db["goals"].insert_one(doc)
    doc["_id"] = result.inserted_id
    return _goal_doc_to_out(doc)


@router.get("/goals", response_model=list[GoalOut])
def list_goals(user_id: str = Depends(get_current_user_id)):
    db = get_db()
    docs = db["goals"].find({"user_id": user_id}).sort("_id", -1)
    return [_goal_doc_to_out(d) for d in docs]


@router.delete("/goals/{goal_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_goal(goal_id: str, user_id: str = Depends(get_current_user_id)):
    db = get_db()
    result = db["goals"].delete_one({"_id": ObjectId(goal_id), "user_id": user_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Goal not found")
    return None
