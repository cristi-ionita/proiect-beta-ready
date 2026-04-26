from __future__ import annotations

from pydantic import Field, field_validator

from app.schemas.base import BaseSchema

MAX_REALISTIC_MILEAGE = 5_000_000


def _normalize_required_text(value: str) -> str:
    cleaned = " ".join(value.strip().split())
    if not cleaned:
        raise ValueError("This field is required.")
    return cleaned


class HandoverStartRequestSchema(BaseSchema):
    mileage_start: int = Field(..., ge=0, le=MAX_REALISTIC_MILEAGE)
    dashboard_warnings_start: str = Field(..., min_length=1)
    damage_notes_start: str = Field(..., min_length=1)
    notes_start: str = Field(..., min_length=1)

    has_documents: bool
    has_medkit: bool
    has_extinguisher: bool
    has_warning_triangle: bool
    has_spare_wheel: bool

    @field_validator(
        "dashboard_warnings_start",
        "damage_notes_start",
        "notes_start",
        mode="before",
    )
    @classmethod
    def validate_required_text(cls, value: str) -> str:
        return _normalize_required_text(value)


class HandoverStartResponseSchema(BaseSchema):
    assignment_id: int
    mileage_start: int
    dashboard_warnings_start: str
    damage_notes_start: str
    notes_start: str

    has_documents: bool
    has_medkit: bool
    has_extinguisher: bool
    has_warning_triangle: bool
    has_spare_wheel: bool


class HandoverEndRequestSchema(BaseSchema):
    mileage_end: int = Field(..., ge=0, le=MAX_REALISTIC_MILEAGE)
    dashboard_warnings_end: str = Field(..., min_length=1)
    damage_notes_end: str = Field(..., min_length=1)
    notes_end: str = Field(..., min_length=1)

    @field_validator(
        "dashboard_warnings_end",
        "damage_notes_end",
        "notes_end",
        mode="before",
    )
    @classmethod
    def validate_required_text(cls, value: str) -> str:
        return _normalize_required_text(value)


class HandoverEndResponseSchema(BaseSchema):
    assignment_id: int
    mileage_end: int
    dashboard_warnings_end: str
    damage_notes_end: str
    notes_end: str