from __future__ import annotations

import os
import shutil
from datetime import UTC, datetime
from pathlib import Path

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile
from fastapi.responses import FileResponse
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.v1.dependencies import require_employee
from app.db.models.user import User
from app.db.models.vehicle import VehicleStatus
from app.db.models.vehicle_assignment import AssignmentStatus, VehicleAssignment
from app.db.models.vehicle_handover_report import VehicleHandoverReport
from app.db.models.vehicle_issue import VehicleIssue, VehicleIssueStatus
from app.db.models.vehicle_photo import VehiclePhoto
from app.db.session import get_db
from app.schemas.my_vehicle import (
    MyVehicleAssignmentSchema,
    MyVehicleHandoverEndSchema,
    MyVehicleHandoverStartSchema,
    MyVehicleIssueSchema,
    MyVehiclePhotoSchema,
    MyVehicleResponseSchema,
    MyVehicleUserSchema,
    MyVehicleVehicleSchema,
)

router = APIRouter(prefix="/my-vehicle", tags=["my-vehicle"])

UPLOAD_DIR = Path("uploads/vehicles")
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)


async def _get_open_assignment_for_user(
    db: AsyncSession,
    user_id: int,
) -> VehicleAssignment | None:
    result = await db.execute(
        select(VehicleAssignment)
        .where(
            VehicleAssignment.user_id == user_id,
            VehicleAssignment.status.in_(
                [AssignmentStatus.PENDING, AssignmentStatus.ACTIVE]
            ),
            VehicleAssignment.ended_at.is_(None),
        )
        .order_by(VehicleAssignment.id.desc())
    )

    return result.scalars().first()


async def _get_handover_report(
    db: AsyncSession,
    assignment_id: int,
) -> VehicleHandoverReport | None:
    result = await db.execute(
        select(VehicleHandoverReport).where(
            VehicleHandoverReport.assignment_id == assignment_id
        )
    )

    return result.scalar_one_or_none()


def _has_any_value(values: list[object | None]) -> bool:
    return any(value is not None for value in values)


def _build_handover_start(
    report: VehicleHandoverReport,
) -> MyVehicleHandoverStartSchema:
    return MyVehicleHandoverStartSchema(
        mileage_start=report.mileage_start,
        dashboard_warnings_start=report.dashboard_warnings_start,
        damage_notes_start=report.damage_notes_start,
        notes_start=report.notes_start,
        has_documents=report.has_documents,
        has_medkit=report.has_medkit,
        has_extinguisher=report.has_extinguisher,
        has_warning_triangle=report.has_warning_triangle,
        has_spare_wheel=report.has_spare_wheel,
        is_completed=_has_any_value(
            [
                report.mileage_start,
                report.dashboard_warnings_start,
                report.damage_notes_start,
                report.notes_start,
                report.has_documents,
                report.has_medkit,
                report.has_extinguisher,
                report.has_warning_triangle,
                report.has_spare_wheel,
            ]
        ),
    )


def _build_handover_end(
    report: VehicleHandoverReport,
) -> MyVehicleHandoverEndSchema:
    return MyVehicleHandoverEndSchema(
        mileage_end=report.mileage_end,
        dashboard_warnings_end=report.dashboard_warnings_end,
        damage_notes_end=report.damage_notes_end,
        notes_end=report.notes_end,
        is_completed=_has_any_value(
            [
                report.mileage_end,
                report.dashboard_warnings_end,
                report.damage_notes_end,
                report.notes_end,
            ]
        ),
    )


def _build_issue(issue: VehicleIssue) -> MyVehicleIssueSchema:
    return MyVehicleIssueSchema(
        id=issue.id,
        status=issue.status.value,
        need_service_in_km=issue.need_service_in_km,
        need_brakes=issue.need_brakes,
        need_tires=issue.need_tires,
        need_oil=issue.need_oil,
        dashboard_checks=issue.dashboard_checks,
        other_problems=issue.other_problems,
        created_at=issue.created_at,
        updated_at=issue.updated_at,
    )


def _build_photo(photo: VehiclePhoto) -> MyVehiclePhotoSchema:
    return MyVehiclePhotoSchema(
        id=photo.id,
        type=photo.type.value,
        file_name=photo.file_name,
        mime_type=photo.mime_type,
        file_size=photo.file_size,
        created_at=photo.created_at,
    )


@router.get("", response_model=MyVehicleResponseSchema)
async def get_my_vehicle_page(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_employee),
) -> MyVehicleResponseSchema:
    assignment = await _get_open_assignment_for_user(db, current_user.id)

    if assignment is None:
        return MyVehicleResponseSchema(
            user=MyVehicleUserSchema.model_validate(current_user),
            vehicle=None,
            assignment=None,
            handover_start=None,
            handover_end=None,
            open_issues=[],
            photos=[],
        )

    await db.refresh(assignment, attribute_names=["vehicle"])

    report = await _get_handover_report(db, assignment.id)

    issues = (
        await db.execute(
            select(VehicleIssue)
            .where(
                VehicleIssue.vehicle_id == assignment.vehicle_id,
                VehicleIssue.status.notin_(
                    [VehicleIssueStatus.RESOLVED, VehicleIssueStatus.CANCELED]
                ),
            )
            .order_by(VehicleIssue.created_at.desc(), VehicleIssue.id.desc())
        )
    ).scalars().all()

    photos = (
        await db.execute(
            select(VehiclePhoto)
            .where(VehiclePhoto.vehicle_id == assignment.vehicle_id)
            .order_by(VehiclePhoto.created_at.desc(), VehiclePhoto.id.desc())
        )
    ).scalars().all()

    return MyVehicleResponseSchema(
        user=MyVehicleUserSchema.model_validate(current_user),
        vehicle=MyVehicleVehicleSchema(
            id=assignment.vehicle.id,
            brand=assignment.vehicle.brand,
            model=assignment.vehicle.model,
            license_plate=assignment.vehicle.license_plate,
            status=assignment.vehicle.status.value,
            current_mileage=assignment.vehicle.current_mileage,
            created_at=assignment.vehicle.created_at,
            updated_at=assignment.vehicle.updated_at,
        ),
        assignment=MyVehicleAssignmentSchema(
            id=assignment.id,
            status=assignment.status.value,
            started_at=assignment.started_at,
            ended_at=assignment.ended_at,
        ),
        handover_start=_build_handover_start(report) if report is not None else None,
        handover_end=_build_handover_end(report) if report is not None else None,
        open_issues=[_build_issue(issue) for issue in issues],
        photos=[_build_photo(photo) for photo in photos],
    )


@router.post("/confirm")
async def confirm_assignment(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_employee),
):
    assignment = await _get_open_assignment_for_user(db, current_user.id)

    if assignment is None:
        raise HTTPException(status_code=404, detail="No assignment found.")

    if assignment.status != AssignmentStatus.PENDING:
        raise HTTPException(status_code=400, detail="Assignment is not pending.")

    assignment.status = AssignmentStatus.ACTIVE

    await db.commit()
    await db.refresh(assignment)

    return {"status": "confirmed", "assignment_id": assignment.id}


@router.post("/reject")
async def reject_assignment(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_employee),
):
    assignment = await _get_open_assignment_for_user(db, current_user.id)

    if assignment is None:
        raise HTTPException(status_code=404, detail="No assignment found.")

    await db.refresh(assignment, attribute_names=["vehicle"])

    now = datetime.now(UTC)

    if assignment.status == AssignmentStatus.PENDING:
        assignment.status = AssignmentStatus.REJECTED
        assignment.ended_at = now
        response_status = "rejected"
    elif assignment.status == AssignmentStatus.ACTIVE:
        assignment.status = AssignmentStatus.CLOSED
        assignment.ended_at = now
        response_status = "closed"
    else:
        raise HTTPException(
            status_code=400,
            detail="Assignment cannot be rejected.",
        )

    if assignment.vehicle.status == VehicleStatus.ASSIGNED:
        assignment.vehicle.status = VehicleStatus.AVAILABLE

    await db.commit()
    await db.refresh(assignment)

    return {"status": response_status, "assignment_id": assignment.id}


@router.post("/photos/{photo_id}/replace", response_model=MyVehiclePhotoSchema)
async def replace_photo(
    photo_id: int,
    file: UploadFile = File(...),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_employee),
) -> MyVehiclePhotoSchema:
    assignment = await _get_open_assignment_for_user(db, current_user.id)

    if assignment is None:
        raise HTTPException(status_code=404, detail="No assignment.")

    if assignment.status != AssignmentStatus.PENDING:
        raise HTTPException(
            status_code=400,
            detail="Photos can be replaced only before confirming the assignment.",
        )

    photo = (
        await db.execute(
            select(VehiclePhoto).where(
                VehiclePhoto.id == photo_id,
                VehiclePhoto.vehicle_id == assignment.vehicle_id,
            )
        )
    ).scalar_one_or_none()

    if photo is None:
        raise HTTPException(status_code=404, detail="Photo not found.")

    if not file.content_type or not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="Only image files are allowed.")

    folder = UPLOAD_DIR / f"vehicle_{assignment.vehicle_id}"
    folder.mkdir(parents=True, exist_ok=True)

    file_ext = os.path.splitext(file.filename or "")[1] or ".jpg"
    file_name = f"{photo.type.value}_employee_{os.urandom(6).hex()}{file_ext}"
    file_path = folder / file_name

    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    old_file_path = Path(photo.file_path)

    photo.file_name = file_name
    photo.file_path = str(file_path)
    photo.mime_type = file.content_type
    photo.file_size = file_path.stat().st_size

    await db.commit()
    await db.refresh(photo)

    if old_file_path.exists():
        old_file_path.unlink(missing_ok=True)

    return _build_photo(photo)


@router.get("/photos/{photo_id}/file")
async def get_photo(
    photo_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_employee),
):
    assignment = await _get_open_assignment_for_user(db, current_user.id)

    if assignment is None:
        raise HTTPException(status_code=404, detail="No assignment.")

    photo = (
        await db.execute(
            select(VehiclePhoto).where(
                VehiclePhoto.id == photo_id,
                VehiclePhoto.vehicle_id == assignment.vehicle_id,
            )
        )
    ).scalar_one_or_none()

    if photo is None:
        raise HTTPException(status_code=404, detail="Photo not found.")

    return FileResponse(
        photo.file_path,
        media_type=photo.mime_type,
        filename=photo.file_name,
    )