from __future__ import annotations

from datetime import datetime
from enum import Enum

from sqlalchemy import DateTime, ForeignKey, Integer, String, func
from sqlalchemy import Enum as SqlEnum
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base


class VehiclePhotoType(str, Enum):
    EXTERIOR = "exterior"
    INTERIOR = "interior"
    DAMAGE = "damage"
    REGISTRATION = "registration"


class VehiclePhoto(Base):
    __tablename__ = "vehicle_photos"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)

    vehicle_id: Mapped[int] = mapped_column(
        ForeignKey("vehicles.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    type: Mapped[VehiclePhotoType] = mapped_column(
        SqlEnum(
            VehiclePhotoType,
            name="vehicle_photo_type",
            values_callable=lambda enum_cls: [item.value for item in enum_cls],
        ),
        nullable=False,
        index=True,
    )

    file_name: Mapped[str] = mapped_column(String(255), nullable=False)
    file_path: Mapped[str] = mapped_column(String(500), nullable=False)
    mime_type: Mapped[str] = mapped_column(String(100), nullable=False)
    file_size: Mapped[int] = mapped_column(Integer, nullable=False)

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
        index=True,
    )