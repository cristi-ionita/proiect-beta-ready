from __future__ import annotations

from datetime import datetime

from sqlalchemy import Boolean, CheckConstraint, DateTime, ForeignKey, Integer, Text, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


class VehicleHandoverReport(Base):
    __tablename__ = "vehicle_handover_reports"

    __table_args__ = (
        CheckConstraint(
            "mileage_start IS NULL OR mileage_start >= 0",
            name="ck_vehicle_handover_reports_mileage_start_non_negative",
        ),
        CheckConstraint(
            "mileage_end IS NULL OR mileage_end >= 0",
            name="ck_vehicle_handover_reports_mileage_end_non_negative",
        ),
        CheckConstraint(
            "mileage_start IS NULL OR mileage_end IS NULL OR mileage_end >= mileage_start",
            name="ck_vehicle_handover_reports_mileage_end_after_start",
        ),
        CheckConstraint(
            "dashboard_warnings_start IS NULL OR char_length(trim(dashboard_warnings_start)) > 0",
            name="ck_vehicle_handover_reports_dashboard_warnings_start_not_blank",
        ),
        CheckConstraint(
            "dashboard_warnings_end IS NULL OR char_length(trim(dashboard_warnings_end)) > 0",
            name="ck_vehicle_handover_reports_dashboard_warnings_end_not_blank",
        ),
        CheckConstraint(
            "damage_notes_start IS NULL OR char_length(trim(damage_notes_start)) > 0",
            name="ck_vehicle_handover_reports_damage_notes_start_not_blank",
        ),
        CheckConstraint(
            "damage_notes_end IS NULL OR char_length(trim(damage_notes_end)) > 0",
            name="ck_vehicle_handover_reports_damage_notes_end_not_blank",
        ),
        CheckConstraint(
            "notes_start IS NULL OR char_length(trim(notes_start)) > 0",
            name="ck_vehicle_handover_reports_notes_start_not_blank",
        ),
        CheckConstraint(
            "notes_end IS NULL OR char_length(trim(notes_end)) > 0",
            name="ck_vehicle_handover_reports_notes_end_not_blank",
        ),
    )

    id: Mapped[int] = mapped_column(primary_key=True, index=True)

    assignment_id: Mapped[int] = mapped_column(
        ForeignKey("vehicle_assignments.id", ondelete="CASCADE"),
        unique=True,
        nullable=False,
        index=True,
    )

    mileage_start: Mapped[int | None] = mapped_column(
        Integer,
        nullable=True,
    )

    mileage_end: Mapped[int | None] = mapped_column(
        Integer,
        nullable=True,
    )

    dashboard_warnings_start: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
    )

    dashboard_warnings_end: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
    )

    damage_notes_start: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
    )

    damage_notes_end: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
    )

    notes_start: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
    )

    notes_end: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
    )

    has_documents: Mapped[bool] = mapped_column(
        Boolean,
        default=False,
        server_default="false",
        nullable=False,
    )

    has_medkit: Mapped[bool] = mapped_column(
        Boolean,
        default=False,
        server_default="false",
        nullable=False,
    )

    has_extinguisher: Mapped[bool] = mapped_column(
        Boolean,
        default=False,
        server_default="false",
        nullable=False,
    )

    has_warning_triangle: Mapped[bool] = mapped_column(
        Boolean,
        default=False,
        server_default="false",
        nullable=False,
    )

    has_spare_wheel: Mapped[bool] = mapped_column(
        Boolean,
        default=False,
        server_default="false",
        nullable=False,
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

    assignment = relationship("VehicleAssignment")