from __future__ import annotations

from datetime import datetime
from enum import Enum

from sqlalchemy import (
    Boolean,
    CheckConstraint,
    DateTime,
    ForeignKey,
    Integer,
    String,
    Text,
    func,
)
from sqlalchemy import Enum as SqlEnum
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


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


class VehicleIssue(Base):
    __tablename__ = "vehicle_issues"

    __table_args__ = (
        CheckConstraint(
            "need_service_in_km IS NULL OR need_service_in_km >= 0",
            name="ck_vehicle_issues_need_service_in_km_non_negative",
        ),
        CheckConstraint(
            "estimated_cost IS NULL OR estimated_cost >= 0",
            name="ck_vehicle_issues_estimated_cost_non_negative",
        ),
        CheckConstraint(
            "final_cost IS NULL OR final_cost >= 0",
            name="ck_vehicle_issues_final_cost_non_negative",
        ),
        CheckConstraint(
            "scheduled_location IS NULL OR char_length(trim(scheduled_location)) > 0",
            name="ck_vehicle_issues_scheduled_location_not_blank_if_present",
        ),
        CheckConstraint(
            "dashboard_checks IS NULL OR char_length(trim(dashboard_checks)) > 0",
            name="ck_vehicle_issues_dashboard_checks_not_blank_if_present",
        ),
        CheckConstraint(
            "other_problems IS NULL OR char_length(trim(other_problems)) > 0",
            name="ck_vehicle_issues_other_problems_not_blank_if_present",
        ),
        CheckConstraint(
            "resolution_notes IS NULL OR char_length(trim(resolution_notes)) > 0",
            name="ck_vehicle_issues_resolution_notes_not_blank_if_present",
        ),
        CheckConstraint(
            "status != 'scheduled' OR scheduled_for IS NOT NULL",
            name="ck_vehicle_issues_scheduled_requires_datetime",
        ),
        CheckConstraint(
            "scheduled_location IS NULL OR scheduled_for IS NOT NULL",
            name="ck_vehicle_issues_scheduled_location_requires_datetime",
        ),
        CheckConstraint(
            "started_at IS NULL OR resolved_at IS NULL OR resolved_at >= started_at",
            name="ck_vehicle_issues_resolved_at_after_started_at",
        ),
        CheckConstraint(
            "status != 'resolved' OR resolved_at IS NOT NULL",
            name="ck_vehicle_issues_resolved_requires_resolved_at",
        ),
        CheckConstraint(
            "status != 'in_progress' OR started_at IS NOT NULL",
            name="ck_vehicle_issues_in_progress_requires_started_at",
        ),
    )

    id: Mapped[int] = mapped_column(primary_key=True, index=True)

    vehicle_id: Mapped[int] = mapped_column(
        ForeignKey("vehicles.id", ondelete="RESTRICT"),
        nullable=False,
        index=True,
    )

    assignment_id: Mapped[int | None] = mapped_column(
        ForeignKey("vehicle_assignments.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )

    reported_by_user_id: Mapped[int] = mapped_column(
        ForeignKey("users.id", ondelete="RESTRICT"),
        nullable=False,
        index=True,
    )

    assigned_mechanic_id: Mapped[int | None] = mapped_column(
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )

    priority: Mapped[VehicleIssuePriority] = mapped_column(
        SqlEnum(
            VehicleIssuePriority,
            name="vehicle_issue_priority",
            values_callable=lambda enum_cls: [item.value for item in enum_cls],
        ),
        default=VehicleIssuePriority.MEDIUM,
        server_default=VehicleIssuePriority.MEDIUM.value,
        nullable=False,
        index=True,
    )

    need_service_in_km: Mapped[int | None] = mapped_column(
        Integer,
        nullable=True,
    )

    need_brakes: Mapped[bool] = mapped_column(
        Boolean,
        nullable=False,
        default=False,
        server_default="false",
    )

    need_tires: Mapped[bool] = mapped_column(
        Boolean,
        nullable=False,
        default=False,
        server_default="false",
    )

    need_oil: Mapped[bool] = mapped_column(
        Boolean,
        nullable=False,
        default=False,
        server_default="false",
    )

    dashboard_checks: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
    )

    other_problems: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
    )

    status: Mapped[VehicleIssueStatus] = mapped_column(
        SqlEnum(
            VehicleIssueStatus,
            name="vehicle_issue_status",
            values_callable=lambda enum_cls: [item.value for item in enum_cls],
        ),
        default=VehicleIssueStatus.OPEN,
        server_default=VehicleIssueStatus.OPEN.value,
        nullable=False,
        index=True,
    )

    scheduled_for: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
        index=True,
    )

    scheduled_location: Mapped[str | None] = mapped_column(
        String(255),
        nullable=True,
    )

    started_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
        index=True,
    )

    resolved_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
        index=True,
    )

    resolution_notes: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
    )

    estimated_cost: Mapped[int | None] = mapped_column(
        Integer,
        nullable=True,
    )

    final_cost: Mapped[int | None] = mapped_column(
        Integer,
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

    vehicle = relationship("Vehicle")
    assignment = relationship("VehicleAssignment")

    reported_by_user = relationship(
        "User",
        foreign_keys=[reported_by_user_id],
    )

    assigned_mechanic = relationship(
        "User",
        foreign_keys=[assigned_mechanic_id],
    )

    photos = relationship(
        "VehicleIssuePhoto",
        back_populates="issue",
        cascade="all, delete-orphan",
        lazy="selectin",
    )