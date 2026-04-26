from __future__ import annotations

from datetime import datetime

from app.schemas.user import UserRole
from app.schemas.vehicle import VehicleStatus
from app.schemas.vehicle_assignment_admin import AssignmentStatus
from app.schemas.base import BaseSchema


class MyVehicleUserSchema(BaseSchema):
    id: int
    full_name: str
    unique_code: str | None = None
    shift_number: str | None = None
    role: UserRole
    is_active: bool


class MyVehicleVehicleSchema(BaseSchema):
    id: int
    brand: str
    model: str
    license_plate: str
    year: int
    vin: str | None = None
    status: VehicleStatus
    current_mileage: int


class MyVehicleAssignmentSchema(BaseSchema):
    id: int
    status: AssignmentStatus
    started_at: datetime
    ended_at: datetime | None = None


class MyVehicleHandoverStartSchema(BaseSchema):
    mileage_start: int | None = None
    dashboard_warnings_start: str | None = None
    damage_notes_start: str | None = None
    notes_start: str | None = None

    has_documents: bool = False
    has_medkit: bool = False
    has_extinguisher: bool = False
    has_warning_triangle: bool = False
    has_spare_wheel: bool = False

    is_completed: bool


class MyVehicleHandoverEndSchema(BaseSchema):
    mileage_end: int | None = None
    dashboard_warnings_end: str | None = None
    damage_notes_end: str | None = None
    notes_end: str | None = None

    is_completed: bool


class MyVehicleIssueSchema(BaseSchema):
    id: int
    status: str
    need_service_in_km: int | None = None
    need_brakes: bool = False
    need_tires: bool = False
    need_oil: bool = False
    dashboard_checks: str | None = None
    other_problems: str | None = None
    created_at: datetime
    updated_at: datetime


class MyVehiclePhotoSchema(BaseSchema):
    id: int
    type: str
    file_name: str
    mime_type: str
    file_size: int
    created_at: datetime


class MyVehicleResponseSchema(BaseSchema):
    user: MyVehicleUserSchema
    vehicle: MyVehicleVehicleSchema | None = None
    assignment: MyVehicleAssignmentSchema | None = None
    handover_start: MyVehicleHandoverStartSchema | None = None
    handover_end: MyVehicleHandoverEndSchema | None = None
    open_issues: list[MyVehicleIssueSchema]
    photos: list[MyVehiclePhotoSchema] = []