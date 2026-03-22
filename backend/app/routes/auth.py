"""Auth routes — register, login, me."""

from __future__ import annotations

from datetime import datetime, timezone

from bson import ObjectId
from fastapi import APIRouter, Depends, HTTPException, status

from app.core.security import (
    create_access_token,
    get_current_user_id,
    hash_password,
    verify_password,
)
from app.db.mongo import get_db
from app.models.auth import LoginRequest, RegisterRequest, TokenResponse, UserOut, UpdateUserRequest

router = APIRouter(prefix="/v1/auth", tags=["auth"])


@router.post("/register", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
def register(body: RegisterRequest):
    db = get_db()

    if db["users"].find_one({"email": body.email}):
        raise HTTPException(status_code=400, detail="Email already registered")

    doc = {
        "email": body.email,
        "name": body.name,
        "password_hash": hash_password(body.password),
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    result = db["users"].insert_one(doc)

    token = create_access_token({"sub": str(result.inserted_id)})
    return TokenResponse(access_token=token)


@router.post("/login", response_model=TokenResponse)
def login(body: LoginRequest):
    db = get_db()
    user = db["users"].find_one({"email": body.email})
    if not user or not verify_password(body.password, user["password_hash"]):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    token = create_access_token({"sub": str(user["_id"])})
    return TokenResponse(access_token=token)


@router.get("/me", response_model=UserOut)
def me(user_id: str = Depends(get_current_user_id)):
    db = get_db()
    user = db["users"].find_one({"_id": ObjectId(user_id)})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return UserOut(id=str(user["_id"]), email=user["email"], name=user["name"])


@router.patch("/me", response_model=UserOut)
def update_me(body: UpdateUserRequest, user_id: str = Depends(get_current_user_id)):
    db = get_db()
    user = db["users"].find_one({"_id": ObjectId(user_id)})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Update only provided fields
    update_data = {}
    if body.name is not None:
        update_data["name"] = body.name
    
    if update_data:
        db["users"].update_one({"_id": ObjectId(user_id)}, {"$set": update_data})
        user.update(update_data)
    
    return UserOut(id=str(user["_id"]), email=user["email"], name=user["name"])
