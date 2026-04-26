from __future__ import annotations

from pydantic import Field, field_validator

from app.schemas.base import BaseSchema
from app.schemas.user import UserReadSchema


class LoginRequestSchema(BaseSchema):
    username: str = Field(..., min_length=3, max_length=100)
    password: str = Field(..., min_length=1, max_length=255)

    @field_validator("username", mode="before")
    @classmethod
    def normalize_username(cls, value: str) -> str:
        cleaned = value.strip()
        if not cleaned:
            raise ValueError("Username is required.")
        return cleaned

    @field_validator("password", mode="before")
    @classmethod
    def validate_password(cls, value: str) -> str:
        cleaned = value.strip()
        if not cleaned:
            raise ValueError("Password is required.")
        return cleaned

class ForgotPasswordRequestSchema(BaseSchema):
    email: str = Field(..., min_length=3, max_length=255)

    @field_validator("email", mode="before")
    @classmethod
    def normalize_email(cls, value: str) -> str:
        cleaned = value.strip().lower()
        if not cleaned:
            raise ValueError("Email is required.")
        return cleaned


class ResetPasswordRequestSchema(BaseSchema):
    token: str = Field(..., min_length=20, max_length=255)
    password: str = Field(..., min_length=8, max_length=255)

    @field_validator("token", mode="before")
    @classmethod
    def normalize_token(cls, value: str) -> str:
        cleaned = value.strip()
        if not cleaned:
            raise ValueError("Token is required.")
        return cleaned

    @field_validator("password", mode="before")
    @classmethod
    def validate_password(cls, value: str) -> str:
        cleaned = value.strip()
        if len(cleaned) < 8:
            raise ValueError("Password must contain at least 8 characters.")
        return cleaned


class PasswordResetResponseSchema(BaseSchema):
    message: str

class TokenResponseSchema(BaseSchema):
    access_token: str
    token_type: str = "bearer"
    user: UserReadSchema