from __future__ import annotations

from datetime import date, datetime
from typing import TYPE_CHECKING

from sqlalchemy import CheckConstraint, Date, DateTime, ForeignKey, String, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base

if TYPE_CHECKING:
    from app.db.models.user import User


class EmployeeProfile(Base):
    __tablename__ = "employee_profiles"

    __table_args__ = (
        CheckConstraint(
            "char_length(trim(first_name)) > 0",
            name="ck_employee_profiles_first_name_not_blank",
        ),
        CheckConstraint(
            "char_length(trim(last_name)) > 0",
            name="ck_employee_profiles_last_name_not_blank",
        ),
        CheckConstraint(
            "phone IS NULL OR char_length(trim(phone)) > 0",
            name="ck_employee_profiles_phone_not_blank_when_present",
        ),
        CheckConstraint(
            "address IS NULL OR char_length(trim(address)) > 0",
            name="ck_employee_profiles_address_not_blank_when_present",
        ),
        CheckConstraint(
            "position IS NULL OR char_length(trim(position)) > 0",
            name="ck_employee_profiles_position_not_blank_when_present",
        ),
        CheckConstraint(
            "department IS NULL OR char_length(trim(department)) > 0",
            name="ck_employee_profiles_department_not_blank_when_present",
        ),
        CheckConstraint(
            "iban IS NULL OR char_length(trim(iban)) > 0",
            name="ck_employee_profiles_iban_not_blank_when_present",
        ),
        CheckConstraint(
            "emergency_contact_name IS NULL OR char_length(trim(emergency_contact_name)) > 0",
            name="ck_emp_profiles_emerg_contact_name_not_blank",
        ),
        CheckConstraint(
            "emergency_contact_phone IS NULL OR char_length(trim(emergency_contact_phone)) > 0",
            name="ck_emp_profiles_emerg_contact_phone_not_blank",
        ),
    )

    id: Mapped[int] = mapped_column(primary_key=True, index=True)

    user_id: Mapped[int] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        unique=True,
        index=True,
    )

    first_name: Mapped[str] = mapped_column(
        String(100),
        nullable=False,
    )

    last_name: Mapped[str] = mapped_column(
        String(100),
        nullable=False,
    )

    phone: Mapped[str | None] = mapped_column(
        String(30),
        nullable=True,
        index=True,
    )

    address: Mapped[str | None] = mapped_column(
        String(255),
        nullable=True,
    )

    position: Mapped[str | None] = mapped_column(
        String(100),
        nullable=True,
        index=True,
    )

    department: Mapped[str | None] = mapped_column(
        String(100),
        nullable=True,
        index=True,
    )

    hire_date: Mapped[date | None] = mapped_column(
        Date,
        nullable=True,
        index=True,
    )

    iban: Mapped[str | None] = mapped_column(
        String(64),
        nullable=True,
    )

    emergency_contact_name: Mapped[str | None] = mapped_column(
        String(100),
        nullable=True,
    )

    emergency_contact_phone: Mapped[str | None] = mapped_column(
        String(30),
        nullable=True,
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )

    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )

    user: Mapped[User] = relationship(
        "User",
        back_populates="employee_profile",
        lazy="joined",
    )

    @property
    def full_name(self) -> str:
        return f"{self.first_name} {self.last_name}"