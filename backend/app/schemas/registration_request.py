from __future__ import annotations

from datetime import datetime
from enum import Enum

from pydantic import EmailStr, Field, field_validator

from app.schemas.base import BaseSchema


class RegistrationRequestRole(str, Enum):
    EMPLOYEE = "employee"
    MECHANIC = "mechanic"


class RegistrationRequestStatus(str, Enum):
    PENDING = "pending"
    APPROVED = "approved"
    REJECTED = "rejected"


class RegistrationRequestBaseSchema(BaseSchema):
    full_name: str = Field(..., min_length=2, max_length=150)
    email: EmailStr | None = None
    unique_code: str | None = Field(default=None, max_length=50)
    username: str | None = Field(default=None, max_length=50)
    shift_number: str | None = Field(default=None, max_length=20)

    @field_validator("full_name")
    @classmethod
    def validate_full_name(cls, value: str) -> str:
        cleaned = " ".join(value.strip().split())
        if not cleaned:
            raise ValueError("full_name must not be blank")
        return cleaned

    @field_validator("unique_code", "username", "shift_number")
    @classmethod
    def normalize_optional_strings(cls, value: str | None) -> str | None:
        if value is None:
            return None

        cleaned = value.strip()
        return cleaned or None


class RegistrationRequestCreateSchema(RegistrationRequestBaseSchema):
    password: str = Field(..., min_length=8, max_length=128)
    role: RegistrationRequestRole = RegistrationRequestRole.EMPLOYEE

    @field_validator("password")
    @classmethod
    def validate_password(cls, value: str) -> str:
        cleaned = value.strip()
        if len(cleaned) < 8:
            raise ValueError("password must be at least 8 characters")
        return cleaned


class RegistrationRequestReadSchema(BaseSchema):
    id: int
    full_name: str
    email: EmailStr | None
    unique_code: str | None
    username: str | None
    shift_number: str | None
    role: RegistrationRequestRole
    status: RegistrationRequestStatus
    email_verification_sent_at: datetime | None
    email_verification_expires_at: datetime | None
    email_verified_at: datetime | None
    approved_at: datetime | None
    approved_by_user_id: int | None
    rejected_at: datetime | None
    rejected_by_user_id: int | None
    rejection_reason: str | None
    created_at: datetime
    updated_at: datetime


class PendingRegistrationRequestListItemSchema(BaseSchema):
    id: int
    full_name: str
    email: EmailStr | None
    unique_code: str | None
    username: str | None
    shift_number: str | None
    role: RegistrationRequestRole
    status: RegistrationRequestStatus
    email_verification_sent_at: datetime | None
    email_verification_expires_at: datetime | None
    email_verified_at: datetime | None
    created_at: datetime


class VerifyEmailRequestSchema(BaseSchema):
    token: str = Field(..., min_length=1, max_length=255)

    @field_validator("token", mode="before")
    @classmethod
    def validate_token(cls, value: str) -> str:
        cleaned = value.strip()
        if not cleaned:
            raise ValueError("token must not be blank")
        return cleaned


class VerifyEmailResponseSchema(BaseSchema):
    success: bool = True
    message: str


class ResendVerificationEmailRequestSchema(BaseSchema):
    email: EmailStr

    @field_validator("email", mode="before")
    @classmethod
    def normalize_email(cls, value: str) -> str:
        cleaned = value.strip().lower()
        if not cleaned:
            raise ValueError("email must not be blank")
        return cleaned


class ResendVerificationEmailResponseSchema(BaseSchema):
    success: bool = True
    message: str