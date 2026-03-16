"""Expenses & Goals routes."""

from __future__ import annotations

from datetime import datetime, timezone

from bson import ObjectId
from fastapi import APIRouter, Depends, HTTPException, status

from app.core.security import get_current_user_id
from app.db.mongo import get_db
from app.models.expenses import ExpenseIn, ExpenseOut, GoalIn, GoalOut

router = APIRouter(prefix="/v1", tags=["expenses-goals"])


# --- Expenses ---


@router.post("/expenses", response_model=ExpenseOut, status_code=status.HTTP_201_CREATED)
def create_expense(body: ExpenseIn, user_id: str = Depends(get_current_user_id)):
    db = get_db()
    doc = {
        "user_id": user_id,
        "category": body.category,
        "amount": body.amount,
        "description": body.description,
        "date": body.date or datetime.now(timezone.utc).strftime("%Y-%m-%d"),
    }
    result = db["expenses"].insert_one(doc)
    return ExpenseOut(id=str(result.inserted_id), **doc)


@router.get("/expenses", response_model=list[ExpenseOut])
def list_expenses(user_id: str = Depends(get_current_user_id)):
    db = get_db()
    docs = db["expenses"].find({"user_id": user_id}).sort("_id", -1)
    return [ExpenseOut(id=str(d["_id"]), **{k: d[k] for k in ("user_id", "category", "amount", "description", "date") if k in d}) for d in docs]


@router.delete("/expenses/{expense_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_expense(expense_id: str, user_id: str = Depends(get_current_user_id)):
    db = get_db()
    result = db["expenses"].delete_one({"_id": ObjectId(expense_id), "user_id": user_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Expense not found")
    return None


# --- Goals ---


@router.post("/goals", response_model=GoalOut, status_code=status.HTTP_201_CREATED)
def create_goal(body: GoalIn, user_id: str = Depends(get_current_user_id)):
    db = get_db()
    doc = {
        "user_id": user_id,
        "title": body.title,
        "target_amount": body.target_amount,
        "deadline": body.deadline,
        "priority": body.priority,
    }
    result = db["goals"].insert_one(doc)
    return GoalOut(id=str(result.inserted_id), **doc)


@router.get("/goals", response_model=list[GoalOut])
def list_goals(user_id: str = Depends(get_current_user_id)):
    db = get_db()
    docs = db["goals"].find({"user_id": user_id}).sort("_id", -1)
    return [GoalOut(id=str(d["_id"]), **{k: d[k] for k in ("user_id", "title", "target_amount", "deadline", "priority") if k in d}) for d in docs]


@router.delete("/goals/{goal_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_goal(goal_id: str, user_id: str = Depends(get_current_user_id)):
    db = get_db()
    result = db["goals"].delete_one({"_id": ObjectId(goal_id), "user_id": user_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Goal not found")
    return None
