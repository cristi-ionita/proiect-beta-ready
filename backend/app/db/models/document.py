from __future__ import annotations

from datetime import datetime
from enum import Enum

from sqlalchemy import CheckConstraint, DateTime, ForeignKey, Integer, String, func
from sqlalchemy import Enum as SqlEnum
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


class DocumentType(str, Enum):
    CONTRACT = "contract"
    PAYSLIP = "payslip"
    ID_CARD = "id_card"
    PASSPORT = "passport"
    DRIVER_LICENSE = "driver_license"
    TAX_NUMBER = "tax_number"
    BANK_CARD = "bank_card"
    MEDICAL_CERTIFICATE = "medical_certificate"
    OTHER = "other"


class DocumentCategory(str, Enum):
    COMPANY = "company"
    PERSONAL = "personal"


class DocumentStatus(str, Enum):
    ACTIVE = "active"
    EXPIRED = "expired"
    ARCHIVED = "archived"


class Document(Base):
    __tablename__ = "documents"

    __table_args__ = (
        CheckConstraint(
            "char_length(trim(file_name)) > 0",
            name="ck_documents_file_name_not_blank",
        ),
        CheckConstraint(
            "char_length(trim(file_path)) > 0",
            name="ck_documents_file_path_not_blank",
        ),
        CheckConstraint(
            "char_length(trim(mime_type)) > 0",
            name="ck_documents_mime_type_not_blank",
        ),
        CheckConstraint(
            "title IS NULL OR char_length(trim(title)) > 0",
            name="ck_documents_title_not_blank_when_present",
        ),
        CheckConstraint(
            "file_size IS NOT NULL AND file_size > 0",
            name="ck_documents_file_size_positive",
        ),
    )

    id: Mapped[int] = mapped_column(primary_key=True, index=True)

    user_id: Mapped[int] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    uploaded_by: Mapped[int | None] = mapped_column(
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )

    type: Mapped[DocumentType] = mapped_column(
        SqlEnum(
            DocumentType,
            name="document_type",
            values_callable=lambda enum_cls: [e.value for e in enum_cls],
        ),
        nullable=False,
        index=True,
    )

    category: Mapped[DocumentCategory] = mapped_column(
        SqlEnum(
            DocumentCategory,
            name="document_category",
            values_callable=lambda enum_cls: [e.value for e in enum_cls],
        ),
        nullable=False,
        index=True,
    )

    status: Mapped[DocumentStatus] = mapped_column(
        SqlEnum(
            DocumentStatus,
            name="document_status",
            values_callable=lambda enum_cls: [e.value for e in enum_cls],
        ),
        default=DocumentStatus.ACTIVE,
        server_default=DocumentStatus.ACTIVE.value,
        nullable=False,
        index=True,
    )

    title: Mapped[str | None] = mapped_column(
        String(255),
        nullable=True,
    )

    file_name: Mapped[str] = mapped_column(
        String(255),
        nullable=False,
    )

    file_path: Mapped[str] = mapped_column(
        String(500),
        nullable=False,
        unique=True,
    )

    mime_type: Mapped[str] = mapped_column(
        String(100),
        nullable=False,
    )

    file_size: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
    )

    expires_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
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

    user = relationship("User", foreign_keys=[user_id])
    uploader = relationship("User", foreign_keys=[uploaded_by])