from __future__ import annotations

import shutil
import uuid
from pathlib import Path
from typing import Annotated

from fastapi import (
    APIRouter,
    Depends,
    File,
    Form,
    HTTPException,
    Path as PathParam,
    UploadFile,
    status,
)
from fastapi.responses import FileResponse
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.v1.dependencies import require_admin, require_employee, require_mechanic
from app.core.config import settings
from app.db.models.user import User
from app.db.models.vehicle_issue_photo import VehicleIssuePhoto
from app.db.session import get_db
from app.schemas.vehicle_issue import (
    VehicleIssueCreateRequestSchema,
    VehicleIssueListResponseSchema,
    VehicleIssuePriority,
    VehicleIssueReadSchema,
    VehicleIssueUpdateRequestSchema,
)
from app.services.vehicle_issue_service import VehicleIssueService

router = APIRouter(prefix="/vehicle-issues", tags=["vehicle-issues"])

UPLOAD_DIR = Path("uploads/issues").resolve()

ALLOWED_PHOTO_MIME_TYPES = {
    "image/png",
    "image/jpeg",
    "image/jpg",
    "image/webp",
    "image/heic",
    "image/heif",
    "image/gif",
    "image/bmp",
    "image/tiff",
    "image/x-tiff",
}

PNG_SIGNATURE = b"\x89PNG\r\n\x1a\n"
JPEG_SIGNATURE_START = b"\xff\xd8"
WEBP_SIGNATURE_START = b"RIFF"
WEBP_SIGNATURE_FORMAT = b"WEBP"
GIF_SIGNATURE_87A = b"GIF87a"
GIF_SIGNATURE_89A = b"GIF89a"
BMP_SIGNATURE = b"BM"
TIFF_SIGNATURE_LE = b"II*\x00"
TIFF_SIGNATURE_BE = b"MM\x00*"


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


def _read_file_prefix(file: UploadFile, max_prefix: int = 32) -> bytes:
    file.file.seek(0)
    prefix = file.file.read(max_prefix)
    file.file.seek(0)

    return prefix


def _validate_photo_signature(file: UploadFile) -> None:
    content_type = file.content_type or ""
    prefix = _read_file_prefix(file)

    if content_type == "image/png":
        if not prefix.startswith(PNG_SIGNATURE):
            _bad_request("Invalid PNG file.")
        return

    if content_type in {"image/jpeg", "image/jpg"}:
        if not prefix.startswith(JPEG_SIGNATURE_START):
            _bad_request("Invalid JPEG file.")
        return

    if content_type == "image/webp":
        if not prefix.startswith(WEBP_SIGNATURE_START) or WEBP_SIGNATURE_FORMAT not in prefix:
            _bad_request("Invalid WEBP file.")
        return

    if content_type == "image/gif":
        if not (
            prefix.startswith(GIF_SIGNATURE_87A)
            or prefix.startswith(GIF_SIGNATURE_89A)
        ):
            _bad_request("Invalid GIF file.")
        return

    if content_type == "image/bmp":
        if not prefix.startswith(BMP_SIGNATURE):
            _bad_request("Invalid BMP file.")
        return

    if content_type in {"image/tiff", "image/x-tiff"}:
        if not (
            prefix.startswith(TIFF_SIGNATURE_LE)
            or prefix.startswith(TIFF_SIGNATURE_BE)
        ):
            _bad_request("Invalid TIFF file.")
        return

    if content_type in {"image/heic", "image/heif"}:
        return

    _bad_request("Unsupported photo type.")


def _validate_photo(file: UploadFile) -> int:
    if file.content_type not in ALLOWED_PHOTO_MIME_TYPES:
        _bad_request("Unsupported photo type.")

    if not file.filename or not file.filename.strip():
        _bad_request("Invalid photo file name.")

    file_size = _detect_file_size(file)

    if file_size <= 0:
        _bad_request("Empty photos are not allowed.")

    if file_size > settings.MAX_UPLOAD_SIZE_BYTES:
        _bad_request(
            f"Photo too large. Maximum allowed size is "
            f"{settings.MAX_UPLOAD_SIZE_BYTES} bytes."
        )

    _validate_photo_signature(file)
    file.file.seek(0)

    return file_size


def _extension_for_mime_type(mime_type: str) -> str:
    extensions = {
        "image/png": ".png",
        "image/jpeg": ".jpg",
        "image/jpg": ".jpg",
        "image/webp": ".webp",
        "image/heic": ".heic",
        "image/heif": ".heif",
        "image/gif": ".gif",
        "image/bmp": ".bmp",
        "image/tiff": ".tiff",
        "image/x-tiff": ".tiff",
    }

    extension = extensions.get(mime_type)

    if extension is None:
        _bad_request("Unsupported photo type.")

    return extension


def _resolve_issue_photo_path(file_path: str) -> Path:
    resolved = Path(file_path).resolve()

    try:
        resolved.relative_to(UPLOAD_DIR)
    except ValueError as exc:
        _forbidden("Invalid photo path.")
        raise exc

    return resolved


def _save_issue_photo_file(
    *,
    issue_id: int,
    file: UploadFile,
) -> tuple[str, str, int]:
    _ensure_upload_dir()

    file_size = _validate_photo(file)

    issue_folder = (UPLOAD_DIR / f"issue_{issue_id}").resolve()

    try:
        issue_folder.relative_to(UPLOAD_DIR)
    except ValueError as exc:
        _forbidden("Invalid upload path.")
        raise exc

    issue_folder.mkdir(parents=True, exist_ok=True)

    extension = _extension_for_mime_type(file.content_type or "")
    file_name = f"issue_{uuid.uuid4().hex}{extension}"
    file_path = (issue_folder / file_name).resolve()

    try:
        file_path.relative_to(issue_folder)
    except ValueError as exc:
        _forbidden("Invalid upload path.")
        raise exc

    file.file.seek(0)

    with file_path.open("xb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    file.file.seek(0)

    return file_name, str(file_path), file_size


@router.post(
    "",
    response_model=VehicleIssueReadSchema,
    status_code=status.HTTP_201_CREATED,
)
async def create_issue(
    priority: VehicleIssuePriority = Form(VehicleIssuePriority.MEDIUM),
    need_service_in_km: int | None = Form(None),
    need_brakes: bool = Form(False),
    need_tires: bool = Form(False),
    need_oil: bool = Form(False),
    dashboard_checks: str | None = Form(None),
    other_problems: str | None = Form(None),
    files: Annotated[list[UploadFile], File()] = [],
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_employee),
) -> VehicleIssueReadSchema:
    if len(files) > 20:
        _bad_request("You can upload a maximum of 20 photos at once.")

    payload = VehicleIssueCreateRequestSchema(
        priority=priority,
        need_service_in_km=need_service_in_km,
        need_brakes=need_brakes,
        need_tires=need_tires,
        need_oil=need_oil,
        dashboard_checks=dashboard_checks,
        other_problems=other_problems,
        has_photos=len(files) > 0,
    )

    issue = await VehicleIssueService.create_issue(
        db=db,
        current_user=current_user,
        payload=payload,
    )

    saved_paths: list[str] = []

    try:
        for file in files:
            file_name, file_path, file_size = _save_issue_photo_file(
                issue_id=issue.id,
                file=file,
            )
            saved_paths.append(file_path)

            db.add(
                VehicleIssuePhoto(
                    issue_id=issue.id,
                    file_name=file_name,
                    file_path=file_path,
                    mime_type=file.content_type or "application/octet-stream",
                    file_size=file_size,
                )
            )

        if files:
            await db.commit()

    except Exception:
        await db.rollback()

        for path in saved_paths:
            Path(path).unlink(missing_ok=True)

        raise

    await db.refresh(issue)
    await VehicleIssueService.hydrate_issue(db, issue)

    return VehicleIssueService.serialize_issue(issue)


@router.get("/photos/{photo_id}")
async def download_issue_photo(
    photo_id: int = PathParam(..., gt=0),
    db: AsyncSession = Depends(get_db),
    _: User = Depends(require_admin),
) -> FileResponse:
    photo = (
        await db.execute(
            select(VehicleIssuePhoto).where(VehicleIssuePhoto.id == photo_id)
        )
    ).scalar_one_or_none()

    if photo is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Photo not found.",
        )

    path = _resolve_issue_photo_path(photo.file_path)

    if not path.exists() or not path.is_file():
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Photo file not found.",
        )

    return FileResponse(
        path=path,
        media_type=photo.mime_type or "image/jpeg",
        filename=photo.file_name,
    )


@router.get("/me", response_model=VehicleIssueListResponseSchema)
async def my_issues(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_employee),
) -> VehicleIssueListResponseSchema:
    return await VehicleIssueService.list_issues_by_reporter(db, current_user.id)


@router.get("/mechanic", response_model=VehicleIssueListResponseSchema)
async def list_mechanic_issues(
    db: AsyncSession = Depends(get_db),
    mechanic: User = Depends(require_mechanic),
) -> VehicleIssueListResponseSchema:
    return await VehicleIssueService.list_issues_by_mechanic(db, mechanic.id)


@router.get("", response_model=VehicleIssueListResponseSchema)
async def list_issues(
    db: AsyncSession = Depends(get_db),
    _: User = Depends(require_admin),
) -> VehicleIssueListResponseSchema:
    return await VehicleIssueService.list_all_issues(db)


@router.patch("/{issue_id}/status", response_model=VehicleIssueReadSchema)
async def update_status(
    issue_id: int = PathParam(..., gt=0),
    payload: VehicleIssueUpdateRequestSchema = ...,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(require_admin),
) -> VehicleIssueReadSchema:
    issue = await VehicleIssueService.get_issue_or_404(db, issue_id)

    issue = await VehicleIssueService.update_issue_by_admin(
        db=db,
        issue=issue,
        payload=payload,
    )

    return VehicleIssueService.serialize_issue(issue)


@router.patch("/{issue_id}/mechanic", response_model=VehicleIssueReadSchema)
async def mechanic_update(
    issue_id: int = PathParam(..., gt=0),
    payload: VehicleIssueUpdateRequestSchema = ...,
    db: AsyncSession = Depends(get_db),
    mechanic: User = Depends(require_mechanic),
) -> VehicleIssueReadSchema:
    issue = await VehicleIssueService.get_issue_or_404(db, issue_id)

    issue = await VehicleIssueService.update_issue_by_mechanic(
        db=db,
        issue=issue,
        mechanic=mechanic,
        payload=payload,
    )

    return VehicleIssueService.serialize_issue(issue)