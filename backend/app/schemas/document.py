from __future__ import annotations

from datetime import datetime

from pydantic import Field, field_validator

from app.db.models.document import DocumentCategory, DocumentStatus, DocumentType
from app.schemas.base import BaseSchema

def _normalize_required_text(value: str) -> str:
    cleaned = " ".join(value.strip().split())
    if not cleaned:
        raise ValueError("Field must not be empty.")
    return cleaned


class DocumentBaseSchema(BaseSchema):
    type: DocumentType
    category: DocumentCategory
    status: DocumentStatus = DocumentStatus.ACTIVE
    expires_at: datetime | None = None


class DocumentCreateSchema(DocumentBaseSchema):
    user_id: int = Field(..., gt=0)


class DocumentUpdateSchema(BaseSchema):
    type: DocumentType | None = None
    category: DocumentCategory | None = None
    status: DocumentStatus | None = None
    expires_at: datetime | None = None


class DocumentReadSchema(DocumentBaseSchema):
    id: int
    user_id: int
    uploaded_by: int | None = None
    file_name: str = Field(..., min_length=1, max_length=255)
    file_path: str = Field(..., min_length=1, max_length=500)
    mime_type: str = Field(..., min_length=1, max_length=100)
    created_at: datetime
    updated_at: datetime

    @field_validator("file_name", "file_path", "mime_type", mode="before")
    @classmethod
    def validate_required_strings(cls, value: str) -> str:
        return _normalize_required_text(value)


class DocumentListResponseSchema(BaseSchema):
    documents: list[DocumentReadSchema]