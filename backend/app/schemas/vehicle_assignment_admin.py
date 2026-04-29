from __future__ import annotations

from datetime import datetime

from pydantic import Field

from app.db.models.vehicle_assignment import AssignmentStatus
from app.schemas.base import BaseSchema


class VehicleAssignmentCreateRequestSchema(BaseSchema):
    user_id: int = Field(..., gt=0)
    vehicle_id: int = Field(..., gt=0)
    shift_number: int | None = Field(default=None, gt=0)


class VehicleAssignmentReadSchema(BaseSchema):
    id: int

    user_id: int
    user_name: str

    vehicle_id: int
    vehicle_license_plate: str
    vehicle_brand: str
    vehicle_model: str
    shift_number: int | None = None

    status: AssignmentStatus

    started_at: datetime
    ended_at: datetime | None = None


class VehicleAssignmentListResponseSchema(BaseSchema):
    assignments: list[VehicleAssignmentReadSchema]


class VehicleAssignmentCloseResponseSchema(BaseSchema):
    id: int
    status: AssignmentStatus
    ended_at: datetime