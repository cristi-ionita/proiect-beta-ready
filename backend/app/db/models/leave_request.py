from __future__ import annotations

from datetime import date, datetime
from enum import Enum

from sqlalchemy import CheckConstraint, Date, DateTime, ForeignKey, Text, func
from sqlalchemy import Enum as SqlEnum
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


class LeaveStatus(str, Enum):
    PENDING = "pending"
    APPROVED = "approved"
    REJECTED = "rejected"
    CANCELED = "canceled"


class LeaveRequest(Base):
    __tablename__ = "leave_requests"

    __table_args__ = (
        CheckConstraint(
            "end_date >= start_date",
            name="ck_leave_requests_end_date_after_start_date",
        ),
        CheckConstraint(
            "reason IS NULL OR char_length(trim(reason)) > 0",
            name="ck_leave_requests_reason_not_blank_if_present",
        ),
        CheckConstraint(
            "rejection_reason IS NULL OR char_length(trim(rejection_reason)) > 0",
            name="ck_leave_requests_rejection_reason_not_blank_if_present",
        ),
        CheckConstraint(
            "("
            "status = 'pending' AND reviewed_by_admin_id IS NULL AND reviewed_at IS NULL"
            ") OR ("
            "status IN ('approved', 'rejected') "
            "AND reviewed_by_admin_id IS NOT NULL "
            "AND reviewed_at IS NOT NULL"
            ") OR ("
            "status = 'canceled'"
            ")",
            name="ck_leave_requests_review_fields_match_status",
        ),
    )

    id: Mapped[int] = mapped_column(primary_key=True, index=True)

    user_id: Mapped[int] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    start_date: Mapped[date] = mapped_column(
        Date,
        nullable=False,
        index=True,
    )

    end_date: Mapped[date] = mapped_column(
        Date,
        nullable=False,
        index=True,
    )

    reason: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
    )

    status: Mapped[LeaveStatus] = mapped_column(
        SqlEnum(
            LeaveStatus,
            name="leave_status",
            values_callable=lambda enum_cls: [e.value for e in enum_cls],
        ),
        default=LeaveStatus.PENDING,
        server_default=LeaveStatus.PENDING.value,
        nullable=False,
        index=True,
    )

    reviewed_by_admin_id: Mapped[int | None] = mapped_column(
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )

    reviewed_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
    )

    rejection_reason: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
        index=True,
    )

    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )

    user = relationship("User", foreign_keys=[user_id])
    reviewed_by_admin = relationship("User", foreign_keys=[reviewed_by_admin_id])