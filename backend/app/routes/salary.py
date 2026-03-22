"""Salary / OCR routes."""

from __future__ import annotations

from datetime import datetime, timezone

from bson import ObjectId
from fastapi import APIRouter, Depends, HTTPException, UploadFile, status

from app.core.security import get_current_user_id
from app.db.mongo import get_db
from app.models.salary import SalaryDocOut, SalaryManualRequest, SalaryVerifyRequest
from app.services.ocr import extract_salary_data

router = APIRouter(prefix="/v1/salary", tags=["salary"])

_MAX_UPLOAD_MB = 10
_ALLOWED_CONTENT_TYPES = {
    "application/pdf",
    "image/png",
    "image/jpeg",
    "image/jpg",
    "image/tiff",
    "application/octet-stream",  # fallback for generic binary
}


def _doc_to_out(doc: dict) -> SalaryDocOut:
    return SalaryDocOut(
        id=str(doc["_id"]),
        user_id=doc["user_id"],
        filename=doc["filename"],
        status=doc.get("status", "pending"),
        extracted=doc.get("extracted"),
        created_at=doc.get("created_at"),
    )


@router.post("/upload", response_model=SalaryDocOut, status_code=status.HTTP_201_CREATED)
async def upload_salary(file: UploadFile, user_id: str = Depends(get_current_user_id)):
    # Validate content type
    if file.content_type and file.content_type not in _ALLOWED_CONTENT_TYPES:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported file type: {file.content_type}. Allowed: PDF, PNG, JPEG, TIFF.",
        )
    db = get_db()
    contents = await file.read()
    # Validate file size
    if len(contents) > _MAX_UPLOAD_MB * 1024 * 1024:
        raise HTTPException(
            status_code=400,
            detail=f"File too large. Maximum size is {_MAX_UPLOAD_MB} MB.",
        )
    extracted = extract_salary_data(file.filename or "unknown", contents)
    doc = {
        "user_id": user_id,
        "filename": file.filename,
        "status": "extracted",
        "extracted": extracted,
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    result = db["salary_docs"].insert_one(doc)
    doc["_id"] = result.inserted_id
    return _doc_to_out(doc)


@router.post("/manual", response_model=SalaryDocOut, status_code=status.HTTP_201_CREATED)
def create_manual_salary(body: SalaryManualRequest, user_id: str = Depends(get_current_user_id)):
    db = get_db()
    month = body.month or datetime.now(timezone.utc).strftime("%Y-%m")

    # Build comprehensive extracted dict — only include non-None values
    extracted = {
        "month": month,
        "source": "manual",
        # Core
        "net_take_home": body.net_take_home,
        # Source metadata
        "income_source_type": body.income_source_type,
        "employer_name": body.employer_name,
        "pay_frequency": body.pay_frequency,
        # Earnings breakdown
        "ctc_annual": body.ctc_annual,
        "gross_monthly": body.gross_monthly,
        "basic": body.basic,
        "hra": body.hra,
        "da": body.da,
        "special_allowance": body.special_allowance,
        "other_allowances": body.other_allowances,
        "performance_bonus": body.performance_bonus,
        "variable_pay": body.variable_pay,
        # Deductions
        "pf_employee": body.pf_employee,
        "professional_tax": body.professional_tax,
        "income_tax_tds": body.income_tax_tds,
        "esi_contribution": body.esi_contribution,
        "other_deductions": body.other_deductions,
        # Additional income sources
        "additional_incomes": [inc.model_dump() for inc in body.additional_incomes] if body.additional_incomes else [],
    }

    # Compute total monthly income (net + additional sources)
    total_additional = sum(inc.monthly_amount for inc in body.additional_incomes)
    extracted["total_additional_income"] = total_additional
    extracted["total_monthly_income"] = body.net_take_home + total_additional

    # Strip None values for cleaner storage
    extracted = {k: v for k, v in extracted.items() if v is not None}

    doc = {
        "user_id": user_id,
        "filename": f"manual-income-{month}",
        "status": "verified",
        "extracted": extracted,
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    result = db["salary_docs"].insert_one(doc)
    doc["_id"] = result.inserted_id
    return _doc_to_out(doc)


@router.get("", response_model=list[SalaryDocOut])
def list_salary(user_id: str = Depends(get_current_user_id)):
    db = get_db()
    docs = db["salary_docs"].find({"user_id": user_id}).sort("_id", -1)
    return [_doc_to_out(d) for d in docs]


@router.get("/{doc_id}", response_model=SalaryDocOut)
def get_salary(doc_id: str, user_id: str = Depends(get_current_user_id)):
    db = get_db()
    doc = db["salary_docs"].find_one({"_id": ObjectId(doc_id), "user_id": user_id})
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
    return _doc_to_out(doc)


@router.get("/{doc_id}/status")
def salary_status(doc_id: str, user_id: str = Depends(get_current_user_id)):
    db = get_db()
    doc = db["salary_docs"].find_one({"_id": ObjectId(doc_id), "user_id": user_id})
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
    return {"doc_id": doc_id, "status": doc.get("status", "pending")}


@router.post("/verify", response_model=SalaryDocOut)
def verify_salary(body: SalaryVerifyRequest, user_id: str = Depends(get_current_user_id)):
    db = get_db()
    doc = db["salary_docs"].find_one({"_id": ObjectId(body.doc_id), "user_id": user_id})
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
    merged = {**(doc.get("extracted") or {}), **body.verified_fields}
    db["salary_docs"].update_one(
        {"_id": ObjectId(body.doc_id)},
        {"$set": {"status": "verified", "extracted": merged}},
    )
    doc["status"] = "verified"
    doc["extracted"] = merged
    return _doc_to_out(doc)


@router.delete("/{doc_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_salary(doc_id: str, user_id: str = Depends(get_current_user_id)):
    db = get_db()
    result = db["salary_docs"].delete_one({"_id": ObjectId(doc_id), "user_id": user_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Document not found")
    return None
