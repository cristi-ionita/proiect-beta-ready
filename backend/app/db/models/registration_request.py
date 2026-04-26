from __future__ import annotations

from datetime import datetime
from typing import TYPE_CHECKING

from sqlalchemy import CheckConstraint, DateTime, ForeignKey, String, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base

if TYPE_CHECKING:
    from app.db.models.user import User


class RegistrationRequest(Base):
    __tablename__ = "registration_requests"

    __table_args__ = (
        CheckConstraint(
            "char_length(trim(full_name)) > 0",
            name="ck_regreq_full_name_not_blank",
        ),
        CheckConstraint(
            "role IN ('employee', 'mechanic')",
            name="ck_regreq_role_valid",
        ),
        CheckConstraint(
            "status IN ('pending', 'approved', 'rejected')",
            name="ck_regreq_status_valid",
        ),
        CheckConstraint(
            "email IS NULL OR char_length(trim(email)) > 0",
            name="ck_regreq_email_not_blank",
        ),
        CheckConstraint(
            "unique_code IS NULL OR char_length(trim(unique_code)) > 0",
            name="ck_regreq_unique_code_not_blank",
        ),
        CheckConstraint(
            "username IS NULL OR char_length(trim(username)) > 0",
            name="ck_regreq_username_not_blank",
        ),
        CheckConstraint(
            "shift_number IS NULL OR char_length(trim(shift_number)) > 0",
            name="ck_regreq_shift_not_blank",
        ),
        CheckConstraint(
            "char_length(trim(password_hash)) > 0",
            name="ck_regreq_password_hash_not_blank",
        ),
        CheckConstraint(
            "rejection_reason IS NULL OR char_length(trim(rejection_reason)) > 0",
            name="ck_regreq_rejection_reason_not_blank",
        ),
        CheckConstraint(
            "email_verification_token IS NULL OR char_length(trim(email_verification_token)) > 0",
            name="ck_regreq_email_verification_token_not_blank",
        ),
    )

    id: Mapped[int] = mapped_column(primary_key=True, index=True)

    full_name: Mapped[str] = mapped_column(
        String(150),
        nullable=False,
        index=True,
    )

    email: Mapped[str | None] = mapped_column(
        String(255),
        unique=True,
        nullable=True,
        index=True,
    )

    unique_code: Mapped[str | None] = mapped_column(
        String(50),
        unique=True,
        nullable=True,
        index=True,
    )

    username: Mapped[str | None] = mapped_column(
        String(50),
        unique=True,
        nullable=True,
        index=True,
    )

    shift_number: Mapped[str | None] = mapped_column(
        String(20),
        nullable=True,
    )

    password_hash: Mapped[str] = mapped_column(
        String(255),
        nullable=False,
    )

    role: Mapped[str] = mapped_column(
        String(20),
        default="employee",
        server_default="employee",
        nullable=False,
        index=True,
    )

    status: Mapped[str] = mapped_column(
        String(20),
        default="pending",
        server_default="pending",
        nullable=False,
        index=True,
    )

    email_verification_token: Mapped[str | None] = mapped_column(
        String(255),
        nullable=True,
        unique=True,
        index=True,
    )

    email_verification_sent_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
    )

    email_verification_expires_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
    )

    email_verified_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
    )

    approved_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
    )

    approved_by_user_id: Mapped[int | None] = mapped_column(
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )

    rejected_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
    )

    rejected_by_user_id: Mapped[int | None] = mapped_column(
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )

    rejection_reason: Mapped[str | None] = mapped_column(
        String(500),
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

    approved_by: Mapped["User | None"] = relationship(
        "User",
        foreign_keys=[approved_by_user_id],
        remote_side="User.id",
        post_update=True,
    )

    rejected_by: Mapped["User | None"] = relationship(
        "User",
        foreign_keys=[rejected_by_user_id],
        remote_side="User.id",
        post_update=True,
    )