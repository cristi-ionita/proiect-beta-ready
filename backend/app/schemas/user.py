from __future__ import annotations

from datetime import datetime
from enum import Enum

from pydantic import EmailStr, Field, field_validator

from app.schemas.base import BaseSchema


class UserRole(str, Enum):
    ADMIN = "admin"
    EMPLOYEE = "employee"
    MECHANIC = "mechanic"


class UserStatus(str, Enum):
    PENDING = "pending"
    APPROVED = "approved"
    REJECTED = "rejected"
    SUSPENDED = "suspended"


class UserBaseSchema(BaseSchema):
    full_name: str = Field(..., min_length=2, max_length=150)
    email: EmailStr | None = None
    unique_code: str | None = Field(default=None, max_length=50)
    username: str | None = Field(default=None, max_length=50)
    shift_number: str | None = Field(default=None, max_length=20)

    @field_validator("full_name", mode="before")
    @classmethod
    def validate_full_name(cls, value: object) -> str:
        if not isinstance(value, str):
            raise ValueError("full_name must be a string")

        cleaned = " ".join(value.strip().split())

        if not cleaned:
            raise ValueError("full_name must not be blank")

        return cleaned

    @field_validator("unique_code", "username", "shift_number", mode="before")
    @classmethod
    def normalize_optional_strings(cls, value: object) -> str | None:
        if value is None:
            return None

        if not isinstance(value, str):
            raise ValueError("value must be a string")

        cleaned = value.strip()

        return cleaned or None


class UserCreateSchema(UserBaseSchema):
    password: str = Field(..., min_length=8, max_length=128)
    role: UserRole = UserRole.EMPLOYEE

    @field_validator("password", mode="before")
    @classmethod
    def validate_password(cls, value: object) -> str:
        if not isinstance(value, str):
            raise ValueError("password must be a string")

        cleaned = value.strip()

        if len(cleaned) < 8:
            raise ValueError("password must be at least 8 characters")

        return cleaned


class UserLoginSchema(BaseSchema):
    username: str = Field(..., min_length=3, max_length=50)
    password: str = Field(..., min_length=1, max_length=128)

    @field_validator("username", mode="before")
    @classmethod
    def normalize_username(cls, value: object) -> str:
        if not isinstance(value, str):
            raise ValueError("username must be a string")

        cleaned = value.strip()

        if not cleaned:
            raise ValueError("username must not be blank")

        return cleaned

    @field_validator("password", mode="before")
    @classmethod
    def validate_password(cls, value: object) -> str:
        if not isinstance(value, str):
            raise ValueError("password must be a string")

        cleaned = value.strip()

        if not cleaned:
            raise ValueError("password must not be blank")

        return cleaned


class UserUpdateMeSchema(BaseSchema):
    email: str | None = None
    username: str | None = None
    current_password: str | None = None
    password: str | None = None

class UserReadSchema(BaseSchema):
    id: int
    full_name: str
    email: EmailStr | None
    unique_code: str | None
    username: str | None
    shift_number: str | None
    role: UserRole
    status: UserStatus
    is_active: bool
    approved_at: datetime | None
    approved_by_user_id: int | None
    rejected_at: datetime | None
    rejected_by_user_id: int | None
    rejection_reason: str | None
    last_login_at: datetime | None
    created_at: datetime
    updated_at: datetime


class UserSummarySchema(BaseSchema):
    id: int
    full_name: str
    email: EmailStr | None
    role: UserRole
    status: UserStatus
    is_active: bool
    created_at: datetime


class PendingUserListItemSchema(UserSummarySchema):
    pass


class UserRejectRequestSchema(BaseSchema):
    reason: str = Field(..., min_length=3, max_length=500)

    @field_validator("reason", mode="before")
    @classmethod
    def validate_reason(cls, value: object) -> str:
        if not isinstance(value, str):
            raise ValueError("reason must be a string")

        cleaned = " ".join(value.strip().split())

        if not cleaned:
            raise ValueError("reason must not be blank")

        return cleaned


class UserStatusUpdateSchema(BaseSchema):
    status: UserStatus

    @field_validator("status")
    @classmethod
    def validate_status(cls, value: UserStatus) -> UserStatus:
        if value == UserStatus.PENDING:
            raise ValueError("status update to pending is not allowed")

        return value


class TokenSchema(BaseSchema):
    access_token: str
    token_type: str = "bearer"


class LoginResponseSchema(BaseSchema):
    access_token: str
    token_type: str = "bearer"
    user: UserReadSchema