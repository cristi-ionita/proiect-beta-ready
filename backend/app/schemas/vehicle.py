from __future__ import annotations

from datetime import datetime
from enum import Enum

from pydantic import Field, field_validator

from app.schemas.base import BaseSchema


class VehicleStatus(str, Enum):
    AVAILABLE = "available"
    ASSIGNED = "assigned"
    IN_SERVICE = "in_service"
    OUT_OF_SERVICE = "out_of_service"


def _normalize_text(value: str) -> str:
    cleaned = " ".join(value.strip().split())
    if not cleaned:
        raise ValueError("This field is required.")
    return cleaned


class VehicleBaseSchema(BaseSchema):
    brand: str = Field(..., min_length=1, max_length=100)
    model: str = Field(..., min_length=1, max_length=100)
    license_plate: str = Field(..., min_length=1, max_length=20)
    status: VehicleStatus = VehicleStatus.AVAILABLE
    current_mileage: int = Field(default=0, ge=0)

    @field_validator("brand", "model", mode="before")
    @classmethod
    def validate_required_text(cls, value: str) -> str:
        return _normalize_text(value)

    @field_validator("license_plate", mode="before")
    @classmethod
    def normalize_license_plate(cls, value: str) -> str:
        return _normalize_text(value).upper()


class VehicleCreateSchema(VehicleBaseSchema):
    pass


class VehicleUpdateSchema(BaseSchema):
    brand: str | None = Field(default=None, min_length=1, max_length=100)
    model: str | None = Field(default=None, min_length=1, max_length=100)
    license_plate: str | None = Field(default=None, min_length=1, max_length=20)
    status: VehicleStatus | None = None
    current_mileage: int | None = Field(default=None, ge=0)

    @field_validator("brand", "model", mode="before")
    @classmethod
    def validate_optional_text(cls, value: str | None) -> str | None:
        if value is None:
            return None
        return _normalize_text(value)

    @field_validator("license_plate", mode="before")
    @classmethod
    def normalize_optional_license_plate(cls, value: str | None) -> str | None:
        if value is None:
            return None
        return _normalize_text(value).upper()


class VehicleReadSchema(VehicleBaseSchema):
    id: int
    created_at: datetime
    updated_at: datetime

    # 🔑 IMPORTANT pentru UI
    assigned_to_shift_number: str | int | None = None