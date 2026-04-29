from __future__ import annotations

from datetime import datetime
from enum import Enum

from pydantic import Field, field_validator

from app.schemas.base import BaseSchema


class VehicleIssueStatus(str, Enum):
    OPEN = "open"
    SCHEDULED = "scheduled"
    IN_PROGRESS = "in_progress"
    RESOLVED = "resolved"
    CANCELED = "canceled"


class VehicleIssuePriority(str, Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"


def _normalize_optional_text(value: object) -> str | None:
    if value is None:
        return None

    if not isinstance(value, str):
        raise ValueError("Field must be a string.")

    cleaned = " ".join(value.strip().split())

    return cleaned or None


class VehicleIssueCreateRequestSchema(BaseSchema):
    priority: VehicleIssuePriority = VehicleIssuePriority.MEDIUM
    need_service_in_km: int | None = Field(default=None, ge=0)
    need_brakes: bool = False
    need_tires: bool = False
    need_oil: bool = False
    dashboard_checks: str | None = Field(default=None, max_length=5000)
    other_problems: str | None = Field(default=None, max_length=5000)
    has_photos: bool = False

    @field_validator("dashboard_checks", "other_problems", mode="before")
    @classmethod
    def clean_text_fields(cls, value: object) -> str | None:
        return _normalize_optional_text(value)


class VehicleIssueUpdateRequestSchema(BaseSchema):
    status: VehicleIssueStatus | None = None
    assigned_mechanic_id: int | None = Field(default=None, gt=0)
    scheduled_for: datetime | None = None
    scheduled_location: str | None = Field(default=None, max_length=255)
    started_at: datetime | None = None
    resolved_at: datetime | None = None
    resolution_notes: str | None = Field(default=None, max_length=5000)
    estimated_cost: int | None = Field(default=None, ge=0)
    final_cost: int | None = Field(default=None, ge=0)
    priority: VehicleIssuePriority | None = None

    @field_validator("scheduled_location", "resolution_notes", mode="before")
    @classmethod
    def clean_optional_text_fields(cls, value: object) -> str | None:
        return _normalize_optional_text(value)


class VehicleIssuePhotoSchema(BaseSchema):
    id: int
    file_name: str = Field(..., min_length=1, max_length=255)
    file_path: str = Field(..., min_length=1, max_length=500)
    mime_type: str = Field(..., min_length=1, max_length=100)
    file_size: int = Field(..., gt=0)
    created_at: datetime

    @field_validator("file_name", "file_path", "mime_type", mode="before")
    @classmethod
    def normalize_required_text(cls, value: object) -> str:
        if not isinstance(value, str):
            raise ValueError("Field must be a string.")

        cleaned = " ".join(value.strip().split())

        if not cleaned:
            raise ValueError("Field must not be empty.")

        return cleaned


class VehicleIssueReadSchema(BaseSchema):
    id: int
    vehicle_id: int
    vehicle_license_plate: str | None = None
    vehicle_brand: str | None = None
    vehicle_model: str | None = None

    assignment_id: int | None = None

    reported_by_user_id: int
    reported_by_name: str | None = None
    reported_by_shift_number: int | None = None

    assigned_mechanic_id: int | None = None

    priority: VehicleIssuePriority

    need_service_in_km: int | None = None
    need_brakes: bool
    need_tires: bool
    need_oil: bool

    dashboard_checks: str | None = None
    other_problems: str | None = None

    status: VehicleIssueStatus

    scheduled_for: datetime | None = None
    scheduled_location: str | None = None
    started_at: datetime | None = None
    resolved_at: datetime | None = None
    resolution_notes: str | None = None

    estimated_cost: int | None = None
    final_cost: int | None = None

    created_at: datetime
    updated_at: datetime

    photos: list[VehicleIssuePhotoSchema] = Field(default_factory=list)


class VehicleIssueListResponseSchema(BaseSchema):
    issues: list[VehicleIssueReadSchema]