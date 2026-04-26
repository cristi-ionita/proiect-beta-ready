from __future__ import annotations

from datetime import date, datetime

from pydantic import Field, field_validator

from app.schemas.base import BaseSchema


def _normalize_text(value: str | None) -> str | None:
    if value is None:
        return None

    cleaned = " ".join(value.strip().split())
    return cleaned or None


def _normalize_iban(value: str | None) -> str | None:
    if value is None:
        return None

    cleaned = value.strip().replace(" ", "").upper()
    return cleaned or None


class EmployeeProfileBaseSchema(BaseSchema):
    first_name: str = Field(..., min_length=1, max_length=100)
    last_name: str = Field(..., min_length=1, max_length=100)
    phone: str | None = Field(default=None, max_length=30)
    address: str | None = Field(default=None, max_length=255)
    position: str | None = Field(default=None, max_length=100)
    department: str | None = Field(default=None, max_length=100)
    hire_date: date | None = None
    iban: str | None = Field(default=None, max_length=64)
    emergency_contact_name: str | None = Field(default=None, max_length=100)
    emergency_contact_phone: str | None = Field(default=None, max_length=30)

    @field_validator("first_name", "last_name", mode="before")
    @classmethod
    def validate_required_names(cls, value: str) -> str:
        cleaned = _normalize_text(value)
        if not cleaned:
            raise ValueError("This field is required.")
        return cleaned

    @field_validator(
        "phone",
        "address",
        "position",
        "department",
        "emergency_contact_name",
        "emergency_contact_phone",
        mode="before",
    )
    @classmethod
    def normalize_optional_fields(cls, value: str | None) -> str | None:
        return _normalize_text(value)

    @field_validator("iban", mode="before")
    @classmethod
    def validate_iban(cls, value: str | None) -> str | None:
        return _normalize_iban(value)


class EmployeeProfileCreateSchema(EmployeeProfileBaseSchema):
    user_id: int


class EmployeeProfileUpdateSchema(BaseSchema):
    first_name: str | None = Field(default=None, min_length=1, max_length=100)
    last_name: str | None = Field(default=None, min_length=1, max_length=100)
    phone: str | None = Field(default=None, max_length=30)
    address: str | None = Field(default=None, max_length=255)
    position: str | None = Field(default=None, max_length=100)
    department: str | None = Field(default=None, max_length=100)
    hire_date: date | None = None
    iban: str | None = Field(default=None, max_length=64)
    emergency_contact_name: str | None = Field(default=None, max_length=100)
    emergency_contact_phone: str | None = Field(default=None, max_length=30)

    @field_validator("first_name", "last_name", mode="before")
    @classmethod
    def validate_optional_names(cls, value: str | None) -> str | None:
        if value is None:
            return None
        return _normalize_text(value)

    @field_validator(
        "phone",
        "address",
        "position",
        "department",
        "emergency_contact_name",
        "emergency_contact_phone",
        mode="before",
    )
    @classmethod
    def normalize_optional_fields(cls, value: str | None) -> str | None:
        return _normalize_text(value)

    @field_validator("iban", mode="before")
    @classmethod
    def validate_optional_iban(cls, value: str | None) -> str | None:
        return _normalize_iban(value)


class EmployeeProfileReadSchema(EmployeeProfileBaseSchema):
    id: int
    user_id: int
    created_at: datetime
    updated_at: datetime