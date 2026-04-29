from __future__ import annotations

import os
import shutil
from pathlib import Path
from typing import List

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile, status
from fastapi.responses import FileResponse
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.v1.dependencies import (
    require_admin,
    require_employee,
    require_mechanic,
)
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

UPLOAD_DIR = Path("uploads/issues")
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)


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
    files: List[UploadFile] = File([]),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_employee),
) -> VehicleIssueReadSchema:
    valid_files = [
        file
        for file in files
        if file.content_type and file.content_type.startswith("image/")
    ]

    payload = VehicleIssueCreateRequestSchema(
        priority=priority,
        need_service_in_km=need_service_in_km,
        need_brakes=need_brakes,
        need_tires=need_tires,
        need_oil=need_oil,
        dashboard_checks=dashboard_checks,
        other_problems=other_problems,
        has_photos=len(valid_files) > 0,
    )

    issue = await VehicleIssueService.create_issue(
        db=db,
        current_user=current_user,
        payload=payload,
    )

    if valid_files:
        issue_folder = UPLOAD_DIR / f"issue_{issue.id}"
        issue_folder.mkdir(parents=True, exist_ok=True)

        for file in valid_files:
            ext = os.path.splitext(file.filename or "")[1] or ".jpg"
            file_name = f"issue_{os.urandom(6).hex()}{ext}"
            file_path = issue_folder / file_name

            with open(file_path, "wb") as buffer:
                shutil.copyfileobj(file.file, buffer)

            db.add(
                VehicleIssuePhoto(
                    issue_id=issue.id,
                    file_name=file_name,
                    file_path=str(file_path),
                    mime_type=file.content_type or "image/jpeg",
                    file_size=file_path.stat().st_size,
                )
            )

        await db.commit()

    await db.refresh(issue)
    await VehicleIssueService.hydrate_issue(db, issue)

    return VehicleIssueService.serialize_issue(issue)


@router.get("/photos/{photo_id}")
async def download_issue_photo(
    photo_id: int,
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

    if not os.path.isfile(photo.file_path):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Photo file not found.",
        )

    return FileResponse(
        path=photo.file_path,
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
    issue_id: int,
    payload: VehicleIssueUpdateRequestSchema,
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
    issue_id: int,
    payload: VehicleIssueUpdateRequestSchema,
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