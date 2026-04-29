from __future__ import annotations

import shutil
import uuid
from datetime import datetime
from pathlib import Path

from fastapi import (
    APIRouter,
    Depends,
    File,
    Form,
    HTTPException,
    Path as PathParam,
    Response,
    UploadFile,
    status,
)
from fastapi.responses import FileResponse
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.v1.dependencies import require_admin, require_employee
from app.core.config import get_settings
from app.db.models.document import (
    Document,
    DocumentCategory,
    DocumentStatus,
    DocumentType,
)
from app.db.models.user import User
from app.db.session import get_db
from app.schemas.document import DocumentListResponseSchema, DocumentReadSchema

router = APIRouter(prefix="/documents", tags=["documents"])
settings = get_settings()

UPLOAD_DIR = Path(settings.documents_upload_path).resolve()

ALLOWED_MIME_TYPES = {
    "application/pdf",
    "image/png",
    "image/jpeg",
}

PDF_SIGNATURE = b"%PDF"
PNG_SIGNATURE = b"\x89PNG\r\n\x1a\n"
JPEG_SIGNATURE_START = b"\xff\xd8"
JPEG_SIGNATURE_END = b"\xff\xd9"


def _bad_request(detail: str) -> None:
    raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=detail)


def _forbidden(detail: str = "Access denied.") -> None:
    raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=detail)


def _ensure_upload_dir() -> None:
    UPLOAD_DIR.mkdir(parents=True, exist_ok=True)


def _detect_file_size(file: UploadFile) -> int:
    current_position = file.file.tell()

    file.file.seek(0, 2)
    size = file.file.tell()
    file.file.seek(current_position)

    return size


def _read_file_edges(
    file: UploadFile,
    max_prefix: int = 16,
    max_suffix: int = 2,
) -> tuple[bytes, bytes]:
    file.file.seek(0)
    prefix = file.file.read(max_prefix)

    file.file.seek(0, 2)
    file_size = file.file.tell()

    if file_size >= max_suffix:
        file.file.seek(file_size - max_suffix)
        suffix = file.file.read(max_suffix)
    else:
        file.file.seek(0)
        suffix = file.file.read()

    file.file.seek(0)

    return prefix, suffix


def _validate_file_signature(file: UploadFile) -> None:
    prefix, suffix = _read_file_edges(file)

    if file.content_type == "application/pdf":
        if not prefix.startswith(PDF_SIGNATURE):
            _bad_request("Invalid PDF file.")
        return

    if file.content_type == "image/png":
        if not prefix.startswith(PNG_SIGNATURE):
            _bad_request("Invalid PNG file.")
        return

    if file.content_type == "image/jpeg":
        if not prefix.startswith(JPEG_SIGNATURE_START) or not suffix.endswith(
            JPEG_SIGNATURE_END
        ):
            _bad_request("Invalid JPEG file.")
        return

    _bad_request("Unsupported file type.")


def _validate_file(file: UploadFile) -> int:
    if file.content_type not in ALLOWED_MIME_TYPES:
        _bad_request("Unsupported file type.")

    if not file.filename or not file.filename.strip():
        _bad_request("Invalid file name.")

    file_size = _detect_file_size(file)

    if file_size <= 0:
        _bad_request("Empty files are not allowed.")

    if file_size > settings.MAX_UPLOAD_SIZE_BYTES:
        _bad_request(
            f"File too large. Maximum allowed size is {settings.MAX_UPLOAD_SIZE_BYTES} bytes."
        )

    _validate_file_signature(file)
    file.file.seek(0)

    return file_size


def _parse_document_type(value: str) -> DocumentType:
    try:
        return DocumentType(value.strip().lower())
    except ValueError as exc:
        _bad_request("Invalid document type.")
        raise exc


def _parse_document_category(value: str) -> DocumentCategory:
    try:
        return DocumentCategory(value.strip().lower())
    except ValueError as exc:
        _bad_request("Invalid document category.")
        raise exc


def _safe_original_name(file: UploadFile) -> str:
    original_name = Path(file.filename or "").name.strip()

    if not original_name:
        _bad_request("Invalid file name.")

    return original_name


def _extension_for_mime_type(mime_type: str) -> str:
    if mime_type == "application/pdf":
        return ".pdf"

    if mime_type == "image/png":
        return ".png"

    if mime_type == "image/jpeg":
        return ".jpg"

    _bad_request("Unsupported file type.")

    return ""


def _save_file(file: UploadFile, user_id: int) -> tuple[str, str]:
    _ensure_upload_dir()

    user_dir = (UPLOAD_DIR / f"user_{user_id}").resolve()

    try:
        user_dir.relative_to(UPLOAD_DIR)
    except ValueError as exc:
        _forbidden("Invalid upload path.")
        raise exc

    user_dir.mkdir(parents=True, exist_ok=True)

    original_name = _safe_original_name(file)
    extension = _extension_for_mime_type(file.content_type or "")
    storage_name = f"{uuid.uuid4().hex}{extension}"
    path = (user_dir / storage_name).resolve()

    try:
        path.relative_to(user_dir)
    except ValueError as exc:
        _forbidden("Invalid upload path.")
        raise exc

    file.file.seek(0)

    with path.open("xb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    file.file.seek(0)

    return original_name, str(path)


def _resolve_document_path(file_path: str) -> Path:
    resolved = Path(file_path).resolve()

    try:
        resolved.relative_to(UPLOAD_DIR)
    except ValueError as exc:
        _forbidden("Invalid document path.")
        raise exc

    return resolved


async def _get_document_or_404(db: AsyncSession, doc_id: int) -> Document:
    doc = (
        await db.execute(select(Document).where(Document.id == doc_id))
    ).scalar_one_or_none()

    if doc is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Document not found.",
        )

    return doc


async def _get_user_or_404(db: AsyncSession, user_id: int) -> User:
    user = (
        await db.execute(select(User).where(User.id == user_id))
    ).scalar_one_or_none()

    if user is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found.",
        )

    return user


@router.post(
    "/upload",
    response_model=DocumentReadSchema,
    status_code=status.HTTP_201_CREATED,
)
async def upload_my_document(
    type: str = Form(...),
    file: UploadFile = File(...),
    expires_at: datetime | None = Form(None),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_employee),
) -> DocumentReadSchema:
    file_size = _validate_file(file)
    original_name, path = _save_file(file, current_user.id)

    document = Document(
        user_id=current_user.id,
        uploaded_by=current_user.id,
        type=_parse_document_type(type),
        category=DocumentCategory.PERSONAL,
        status=DocumentStatus.ACTIVE,
        file_name=original_name,
        file_path=path,
        mime_type=file.content_type or "",
        file_size=file_size,
        expires_at=expires_at,
    )

    try:
        db.add(document)
        await db.commit()
        await db.refresh(document)
    except Exception:
        await db.rollback()
        Path(path).unlink(missing_ok=True)
        raise

    return DocumentReadSchema.model_validate(document)


@router.get("/me", response_model=DocumentListResponseSchema)
async def get_my_documents(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_employee),
) -> DocumentListResponseSchema:
    result = await db.execute(
        select(Document)
        .where(Document.user_id == current_user.id)
        .order_by(Document.created_at.desc(), Document.id.desc())
    )

    return DocumentListResponseSchema(
        documents=[
            DocumentReadSchema.model_validate(document)
            for document in result.scalars().all()
        ]
    )


@router.get("/{doc_id}/download")
async def download_my_document(
    doc_id: int = PathParam(..., gt=0),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_employee),
) -> FileResponse:
    doc = await _get_document_or_404(db, doc_id)

    if doc.user_id != current_user.id:
        _forbidden()

    path = _resolve_document_path(doc.file_path)

    if not path.exists() or not path.is_file():
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="File missing.",
        )

    return FileResponse(path, filename=doc.file_name, media_type=doc.mime_type)


@router.delete("/{doc_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_my_document(
    doc_id: int = PathParam(..., gt=0),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_employee),
) -> Response:
    doc = await _get_document_or_404(db, doc_id)

    if doc.user_id != current_user.id:
        _forbidden()

    path = _resolve_document_path(doc.file_path)

    await db.delete(doc)
    await db.commit()

    path.unlink(missing_ok=True)

    return Response(status_code=status.HTTP_204_NO_CONTENT)


@router.get("/admin/{user_id}", response_model=DocumentListResponseSchema)
async def get_user_documents(
    user_id: int = PathParam(..., gt=0),
    db: AsyncSession = Depends(get_db),
    _: User = Depends(require_admin),
) -> DocumentListResponseSchema:
    await _get_user_or_404(db, user_id)

    result = await db.execute(
        select(Document)
        .where(Document.user_id == user_id)
        .order_by(Document.created_at.desc(), Document.id.desc())
    )

    return DocumentListResponseSchema(
        documents=[
            DocumentReadSchema.model_validate(document)
            for document in result.scalars().all()
        ]
    )


@router.get("/admin/file/{doc_id}/download")
async def admin_download_document(
    doc_id: int = PathParam(..., gt=0),
    db: AsyncSession = Depends(get_db),
    _: User = Depends(require_admin),
) -> FileResponse:
    doc = await _get_document_or_404(db, doc_id)
    path = _resolve_document_path(doc.file_path)

    if not path.exists() or not path.is_file():
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="File missing.",
        )

    return FileResponse(path, filename=doc.file_name, media_type=doc.mime_type)


@router.delete("/admin/{doc_id}", status_code=status.HTTP_204_NO_CONTENT)
async def admin_delete_document(
    doc_id: int = PathParam(..., gt=0),
    db: AsyncSession = Depends(get_db),
    _: User = Depends(require_admin),
) -> Response:
    doc = await _get_document_or_404(db, doc_id)
    path = _resolve_document_path(doc.file_path)

    await db.delete(doc)
    await db.commit()

    path.unlink(missing_ok=True)

    return Response(status_code=status.HTTP_204_NO_CONTENT)


@router.post(
    "/admin/upload/{user_id}",
    response_model=DocumentReadSchema,
    status_code=status.HTTP_201_CREATED,
)
async def admin_upload_document(
    user_id: int = PathParam(..., gt=0),
    type: str = Form(...),
    category: str = Form(...),
    file: UploadFile = File(...),
    expires_at: datetime | None = Form(None),
    title: str | None = Form(None),
    db: AsyncSession = Depends(get_db),
    admin_user: User = Depends(require_admin),
) -> DocumentReadSchema:
    await _get_user_or_404(db, user_id)

    file_size = _validate_file(file)
    original_name, path = _save_file(file, user_id)

    document = Document(
        user_id=user_id,
        uploaded_by=admin_user.id,
        type=_parse_document_type(type),
        category=_parse_document_category(category),
        status=DocumentStatus.ACTIVE,
        title=title.strip() if title and title.strip() else None,
        file_name=original_name,
        file_path=path,
        mime_type=file.content_type or "",
        file_size=file_size,
        expires_at=expires_at,
    )

    try:
        db.add(document)
        await db.commit()
        await db.refresh(document)
    except Exception:
        await db.rollback()
        Path(path).unlink(missing_ok=True)
        raise

    return DocumentReadSchema.model_validate(document)