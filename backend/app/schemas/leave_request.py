from __future__ import annotations

from datetime import date, datetime

from pydantic import Field, field_validator, model_validator

from app.schemas.base import BaseSchema


def _normalize_optional_text(value: str | None) -> str | None:
    if value is None:
        return None

    cleaned = " ".join(value.strip().split())
    return cleaned or None


class LeaveRequestCreateSchema(BaseSchema):
    start_date: date
    end_date: date
    reason: str | None = None

    @field_validator("reason", mode="before")
    @classmethod
    def clean_reason(cls, value: str | None) -> str | None:
        return _normalize_optional_text(value)

    @model_validator(mode="after")
    def validate_date_range(self) -> "LeaveRequestCreateSchema":
        if self.end_date < self.start_date:
            raise ValueError("End date must be after or equal to start date.")
        return self


class LeaveRequestReviewSchema(BaseSchema):
    status: str = Field(..., min_length=1, max_length=20)
    rejection_reason: str | None = Field(default=None, max_length=1000)

    @field_validator("status", mode="before")
    @classmethod
    def normalize_status(cls, value: str) -> str:
        cleaned = value.strip().lower()

        allowed = {"approved", "rejected"}
        if cleaned not in allowed:
            raise ValueError("Status must be one of: approved, rejected.")

        return cleaned

    @field_validator("rejection_reason", mode="before")
    @classmethod
    def clean_rejection_reason(cls, value: str | None) -> str | None:
        return _normalize_optional_text(value)

    @model_validator(mode="after")
    def validate_rejection_reason(self) -> "LeaveRequestReviewSchema":
        if self.status == "rejected" and not self.rejection_reason:
            raise ValueError("Rejection reason is required when rejecting a request.")
        return self


class LeaveRequestItemSchema(BaseSchema):
    id: int
    user_id: int
    start_date: date
    end_date: date
    reason: str | None = None
    status: str
    reviewed_by_admin_id: int | None = None
    reviewed_at: datetime | None = None
    rejection_reason: str | None = None
    created_at: datetime
    updated_at: datetime


class LeaveRequestListResponseSchema(BaseSchema):
    requests: list[LeaveRequestItemSchema]


class LeaveRequestCreateResponseSchema(BaseSchema):
    id: int
    user_id: int
    start_date: date
    end_date: date
    reason: str | None = None
    status: str
    created_at: datetime


class LeaveRequestReviewResponseSchema(BaseSchema):
    id: int
    status: str
    reviewed_by_admin_id: int | None = None
    reviewed_at: datetime | None = None
    rejection_reason: str | None = None