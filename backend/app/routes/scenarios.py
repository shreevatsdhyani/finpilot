"""Scenario routes."""

from __future__ import annotations

from datetime import datetime, timezone

from bson import ObjectId
from fastapi import APIRouter, Depends, HTTPException, Query

from app.core.security import get_current_user_id
from app.db.mongo import get_db
from app.models.scenario import ScenarioCompare, ScenarioIn, ScenarioOut
from app.services.scenario import apply_scenario

router = APIRouter(prefix="/v1/scenarios", tags=["scenarios"])


def _doc_to_out(d: dict) -> ScenarioOut:
    return ScenarioOut(
        id=str(d["_id"]),
        user_id=d["user_id"],
        name=d["name"],
        description=d.get("description", ""),
        adjustments=d.get("adjustments", {}),
        horizon=d.get("horizon", 6),
        active=d.get("active", False),
        result=d.get("result"),
    )


@router.post("", response_model=ScenarioOut, status_code=201)
def create_scenario(body: ScenarioIn, user_id: str = Depends(get_current_user_id)):
    db = get_db()
    # compute result
    salaries = list(db["salary_docs"].find({"user_id": user_id, "status": "verified"}))
    expenses_docs = list(db["expenses"].find({"user_id": user_id}))
    avg_income = sum(s.get("extracted", {}).get("net_salary", 0) or s.get("extracted", {}).get("net_take_home", 0) for s in salaries) / max(len(salaries), 1) if salaries else 70000
    avg_expense = sum(e.get("amount", 0) for e in expenses_docs) / max(len(expenses_docs), 1) if expenses_docs else 42000
    result = apply_scenario(avg_income, avg_expense, body.adjustments, body.horizon)

    doc = {
        "user_id": user_id,
        "name": body.name,
        "description": body.description,
        "adjustments": body.adjustments,
        "horizon": body.horizon,
        "active": False,
        "result": result,
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    res = db["scenarios"].insert_one(doc)
    doc["_id"] = res.inserted_id
    return _doc_to_out(doc)


@router.get("", response_model=list[ScenarioOut])
def list_scenarios(user_id: str = Depends(get_current_user_id)):
    db = get_db()
    return [_doc_to_out(d) for d in db["scenarios"].find({"user_id": user_id}).sort("_id", -1)]


@router.post("/{scenario_id}/activate", response_model=ScenarioOut)
def activate_scenario(scenario_id: str, user_id: str = Depends(get_current_user_id)):
    db = get_db()
    # deactivate all first
    db["scenarios"].update_many({"user_id": user_id}, {"$set": {"active": False}})
    result = db["scenarios"].find_one_and_update(
        {"_id": ObjectId(scenario_id), "user_id": user_id},
        {"$set": {"active": True}},
        return_document=True,
    )
    if not result:
        raise HTTPException(status_code=404, detail="Scenario not found")
    return _doc_to_out(result)


@router.get("/compare", response_model=ScenarioCompare)
def compare_scenarios(ids: str = Query(...), user_id: str = Depends(get_current_user_id)):
    db = get_db()
    id_list = [i.strip() for i in ids.split(",") if i.strip()]
    if len(id_list) < 2:
        raise HTTPException(status_code=400, detail="Provide at least 2 comma-separated scenario IDs to compare")
    docs = list(db["scenarios"].find({"_id": {"$in": [ObjectId(i) for i in id_list]}, "user_id": user_id}))
    if not docs:
        raise HTTPException(status_code=404, detail="No matching scenarios found")
    return ScenarioCompare(scenarios=[_doc_to_out(d) for d in docs])


@router.delete("/{scenario_id}", status_code=204)
def delete_scenario(scenario_id: str, user_id: str = Depends(get_current_user_id)):
    db = get_db()
    result = db["scenarios"].delete_one({"_id": ObjectId(scenario_id), "user_id": user_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Scenario not found")
    return None
