from __future__ import annotations

from datetime import datetime
from enum import Enum

from sqlalchemy import CheckConstraint, DateTime, ForeignKey, Index, Integer, String, func, text
from sqlalchemy import Enum as SqlEnum
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


class AssignmentStatus(str, Enum):
    PENDING = "pending"
    ACTIVE = "active"
    REJECTED = "rejected"
    CLOSED = "closed"


class VehicleAssignment(Base):
    __tablename__ = "vehicle_assignments"

    __table_args__ = (
        CheckConstraint(
            "ended_at IS NULL OR ended_at >= started_at",
            name="ck_vehicle_assignments_ended_at_after_started_at",
        ),
        CheckConstraint(
            "(status IN ('pending', 'active', 'rejected') AND ended_at IS NULL) "
            "OR (status = 'closed' AND ended_at IS NOT NULL)",
            name="ck_vehicle_assignments_status_matches_ended_at",
        ),
        CheckConstraint(
            "notes IS NULL OR char_length(trim(notes)) > 0",
            name="ck_vehicle_assignments_notes_not_blank_when_present",
        ),
        CheckConstraint(
            "shift_number > 0",
            name="ck_vehicle_assignments_shift_number_positive",
        ),
        Index(
            "ux_vehicle_assignments_active_vehicle",
            "vehicle_id",
            unique=True,
            postgresql_where=text("status IN ('pending', 'active') AND ended_at IS NULL"),
        ),
        Index(
            "ux_vehicle_assignments_active_user",
            "user_id",
            unique=True,
            postgresql_where=text("status IN ('pending', 'active') AND ended_at IS NULL"),
        ),
    )

    id: Mapped[int] = mapped_column(primary_key=True, index=True)

    user_id: Mapped[int] = mapped_column(
        ForeignKey("users.id", ondelete="RESTRICT"),
        nullable=False,
        index=True,
    )

    vehicle_id: Mapped[int] = mapped_column(
        ForeignKey("vehicles.id", ondelete="RESTRICT"),
        nullable=False,
        index=True,
    )

    shift_number: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
        index=True,
    )

    status: Mapped[AssignmentStatus] = mapped_column(
        SqlEnum(
            AssignmentStatus,
            name="assignment_status",
            values_callable=lambda enum_cls: [e.value for e in enum_cls],
        ),
        default=AssignmentStatus.PENDING,
        server_default=AssignmentStatus.PENDING.value,
        nullable=False,
        index=True,
    )

    started_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
        index=True,
    )

    ended_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
        index=True,
    )

    notes: Mapped[str | None] = mapped_column(
        String(500),
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

    user = relationship("User")
    vehicle = relationship("Vehicle")