"""Auth / User schemas."""

from __future__ import annotations

from pydantic import BaseModel, EmailStr, Field


class RegisterRequest(BaseModel):
    email: EmailStr = Field(..., description="User email")
    password: str = Field(..., min_length=6, description="User login password")
    name: str = Field(..., min_length=1, description="Display name")

    model_config = {
        "json_schema_extra": {
            "example": {
                "email": "user@example.com",
                "password": "secret123",
                "name": "User Name",
            }
        }
    }


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"


class UserOut(BaseModel):
    id: str
    email: str
    name: str


class UpdateUserRequest(BaseModel):
    name: str | None = Field(None, min_length=1, description="Updated display name")
