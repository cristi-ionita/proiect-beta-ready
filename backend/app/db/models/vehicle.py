from __future__ import annotations

from datetime import datetime
from enum import Enum

from sqlalchemy import CheckConstraint, DateTime, Integer, String, func
from sqlalchemy import Enum as SqlEnum
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base


class VehicleStatus(str, Enum):
    AVAILABLE = "available"
    ASSIGNED = "assigned"
    IN_SERVICE = "in_service"
    OUT_OF_SERVICE = "out_of_service"


class Vehicle(Base):
    __tablename__ = "vehicles"

    __table_args__ = (
        CheckConstraint(
            "char_length(trim(brand)) > 0",
            name="ck_vehicles_brand_not_blank",
        ),
        CheckConstraint(
            "char_length(trim(model)) > 0",
            name="ck_vehicles_model_not_blank",
        ),
        CheckConstraint(
            "char_length(trim(license_plate)) > 0",
            name="ck_vehicles_license_plate_not_blank",
        ),
        CheckConstraint(
            "current_mileage >= 0",
            name="ck_vehicles_current_mileage_non_negative",
        ),
    )

    id: Mapped[int] = mapped_column(primary_key=True, index=True)

    brand: Mapped[str] = mapped_column(
        String(100),
        nullable=False,
        index=True,
    )

    model: Mapped[str] = mapped_column(
        String(100),
        nullable=False,
        index=True,
    )

    license_plate: Mapped[str] = mapped_column(
        String(30),
        unique=True,
        nullable=False,
        index=True,
    )

    status: Mapped[VehicleStatus] = mapped_column(
        SqlEnum(
            VehicleStatus,
            name="vehicle_status",
            values_callable=lambda enum_cls: [item.value for item in enum_cls],
        ),
        default=VehicleStatus.AVAILABLE,
        server_default=VehicleStatus.AVAILABLE.value,
        nullable=False,
        index=True,
    )

    current_mileage: Mapped[int] = mapped_column(
        Integer,
        default=0,
        server_default="0",
        nullable=False,
        index=True,
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