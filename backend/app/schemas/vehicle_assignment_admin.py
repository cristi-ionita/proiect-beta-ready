from __future__ import annotations

from datetime import datetime

from pydantic import Field, field_validator

from app.db.models.vehicle_assignment import AssignmentStatus
from app.schemas.base import BaseSchema


class VehicleAssignmentCreateRequestSchema(BaseSchema):
    user_id: int = Field(..., gt=0)
    vehicle_id: int = Field(..., gt=0)
    shift_number: int | None = Field(default=None, gt=0)


class VehicleAssignmentReadSchema(BaseSchema):
    id: int

    user_id: int
    user_name: str = Field(..., min_length=1, max_length=150)

    vehicle_id: int
    vehicle_license_plate: str = Field(..., min_length=1, max_length=30)
    vehicle_brand: str = Field(..., min_length=1, max_length=100)
    vehicle_model: str = Field(..., min_length=1, max_length=100)
    shift_number: int | None = Field(default=None, gt=0)

    status: AssignmentStatus

    started_at: datetime
    ended_at: datetime | None = None

    @field_validator(
        "user_name",
        "vehicle_license_plate",
        "vehicle_brand",
        "vehicle_model",
        mode="before",
    )
    @classmethod
    def normalize_required_text(cls, value: object) -> str:
        if not isinstance(value, str):
            raise ValueError("Field must be a string.")

        cleaned = " ".join(value.strip().split())

        if not cleaned:
            raise ValueError("Field must not be empty.")

        return cleaned


class VehicleAssignmentListResponseSchema(BaseSchema):
    assignments: list[VehicleAssignmentReadSchema]


class VehicleAssignmentCloseResponseSchema(BaseSchema):
    id: int
    status: AssignmentStatus
    ended_at: datetime