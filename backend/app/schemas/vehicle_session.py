from __future__ import annotations

from datetime import datetime


from app.schemas.user import UserRole
from app.schemas.vehicle import VehicleStatus
from app.schemas.vehicle_assignment_admin import AssignmentStatus
from app.schemas.base import BaseSchema


class CurrentSessionSchema(BaseSchema):
    assignment_id: int
    status: AssignmentStatus
    started_at: datetime


class CurrentSessionUserSchema(BaseSchema):
    id: int
    full_name: str
    unique_code: str | None = None
    role: UserRole


class CurrentSessionVehicleSchema(BaseSchema):
    id: int
    brand: str
    model: str
    license_plate: str
    year: int
    status: VehicleStatus
    current_mileage: int


class PreviousHandoverReportSchema(BaseSchema):
    assignment_id: int
    previous_driver_name: str
    previous_session_started_at: datetime
    previous_session_ended_at: datetime | None = None


class CurrentHandoverStartSchema(BaseSchema):
    mileage_start: int | None = None
    dashboard_warnings_start: str | None = None
    damage_notes_start: str | None = None
    notes_start: str | None = None

    has_documents: bool = False
    has_medkit: bool = False
    has_extinguisher: bool = False
    has_warning_triangle: bool = False
    has_spare_wheel: bool = False

    is_completed: bool = False


class CurrentHandoverEndSchema(BaseSchema):
    mileage_end: int | None = None
    dashboard_warnings_end: str | None = None
    damage_notes_end: str | None = None
    notes_end: str | None = None

    is_completed: bool = False


class VehicleSessionPageResponseSchema(BaseSchema):
    session: CurrentSessionSchema
    user: CurrentSessionUserSchema
    vehicle: CurrentSessionVehicleSchema
    previous_handover_report: PreviousHandoverReportSchema | None = None
    handover_start: CurrentHandoverStartSchema | None = None
    handover_end: CurrentHandoverEndSchema | None = None