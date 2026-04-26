from __future__ import annotations

from enum import Enum

from pydantic import  field_validator

from app.schemas.vehicle import VehicleStatus


from app.schemas.base import BaseSchema


class VehicleAvailability(str, Enum):
    FREE = "free"
    OCCUPIED = "occupied"


class VehicleLiveStatusItemSchema(BaseSchema):
    vehicle_id: int
    brand: str
    model: str
    license_plate: str
    year: int
    vehicle_status: VehicleStatus
    availability: VehicleAvailability

    assigned_to_user_id: int | None = None
    assigned_to_name: str | None = None
    assigned_to_shift_number: str | None = None
    active_assignment_id: int | None = None

    @field_validator("license_plate", mode="before")
    @classmethod
    def normalize_license_plate(cls, value: str) -> str:
        return value.strip().upper()


class VehicleLiveStatusResponseSchema(BaseSchema):
    vehicles: list[VehicleLiveStatusItemSchema]