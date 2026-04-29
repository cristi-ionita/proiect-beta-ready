from __future__ import annotations

import os
import shutil
from pathlib import Path

from fastapi import APIRouter, Depends, File, Form, HTTPException, Response, UploadFile, status
from fastapi.responses import FileResponse
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.v1.dependencies import require_admin
from app.db.models.user import User
from app.db.models.vehicle import Vehicle
from app.db.models.vehicle_assignment import AssignmentStatus, VehicleAssignment
from app.db.models.vehicle_photo import VehiclePhoto, VehiclePhotoType
from app.db.session import get_db
from app.schemas.vehicle import VehicleCreateSchema, VehicleReadSchema, VehicleUpdateSchema
from app.schemas.vehicle_live_status import VehicleLiveStatusResponseSchema

router = APIRouter(prefix="/vehicles", tags=["vehicles"])

UPLOAD_DIR = Path("uploads/vehicles")
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)


def _normalize_license_plate(value: str) -> str:
    cleaned = " ".join(value.strip().split()).upper()

    if not cleaned:
        raise HTTPException(status_code=400, detail="License plate is required.")

    return cleaned


def _normalize_vehicle_name(value: str) -> str:
    cleaned = " ".join(value.strip().split())

    if not cleaned:
        raise HTTPException(status_code=400, detail="Vehicle field is required.")

    return cleaned.title()


async def _get_vehicle_or_404(db: AsyncSession, vehicle_id: int) -> Vehicle:
    vehicle = (
        await db.execute(select(Vehicle).where(Vehicle.id == vehicle_id))
    ).scalar_one_or_none()

    if vehicle is None:
        raise HTTPException(status_code=404, detail="Vehicle not found.")

    return vehicle


async def _ensure_unique_license_plate(
    db: AsyncSession,
    license_plate: str,
    exclude_id: int | None = None,
) -> None:
    query = select(Vehicle).where(Vehicle.license_plate == license_plate)

    if exclude_id is not None:
        query = query.where(Vehicle.id != exclude_id)

    existing = (await db.execute(query)).scalar_one_or_none()

    if existing is not None:
        raise HTTPException(status_code=409, detail="License plate already exists.")


async def _get_active_assignment_with_user(
    db: AsyncSession,
    vehicle_id: int,
) -> tuple[VehicleAssignment, User] | None:
    result = await db.execute(
        select(VehicleAssignment, User)
        .join(User, User.id == VehicleAssignment.user_id)
        .where(
            VehicleAssignment.vehicle_id == vehicle_id,
            VehicleAssignment.status == AssignmentStatus.ACTIVE,
        )
    )

    return result.first()


async def _vehicle_has_active_assignment(db: AsyncSession, vehicle_id: int) -> bool:
    result = await db.execute(
        select(VehicleAssignment.id).where(
            VehicleAssignment.vehicle_id == vehicle_id,
            VehicleAssignment.status == AssignmentStatus.ACTIVE,
        )
    )

    return result.scalar_one_or_none() is not None


def _vehicle_response(
    vehicle: Vehicle,
    shift_number: str | int | None = None,
) -> VehicleReadSchema:
    data = VehicleReadSchema.model_validate(vehicle).model_dump()
    data["assigned_to_shift_number"] = shift_number
    return VehicleReadSchema(**data)


@router.post("", response_model=VehicleReadSchema, status_code=status.HTTP_201_CREATED)
async def create_vehicle(
    payload: VehicleCreateSchema,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(require_admin),
) -> VehicleReadSchema:
    data = payload.model_dump()
    data["brand"] = _normalize_vehicle_name(data["brand"])
    data["model"] = _normalize_vehicle_name(data["model"])
    data["license_plate"] = _normalize_license_plate(payload.license_plate)

    await _ensure_unique_license_plate(db, data["license_plate"])

    vehicle = Vehicle(**data)

    db.add(vehicle)
    await db.commit()
    await db.refresh(vehicle)

    return _vehicle_response(vehicle)


@router.get("", response_model=list[VehicleReadSchema])
async def list_vehicles(
    db: AsyncSession = Depends(get_db),
    _: User = Depends(require_admin),
) -> list[VehicleReadSchema]:
    vehicles = (
        await db.execute(select(Vehicle).order_by(Vehicle.id.desc()))
    ).scalars().all()

    return [_vehicle_response(vehicle) for vehicle in vehicles]


@router.get("/live-status", response_model=VehicleLiveStatusResponseSchema)
async def get_live_status(
    db: AsyncSession = Depends(get_db),
    _: User = Depends(require_admin),
) -> VehicleLiveStatusResponseSchema:
    vehicles = (
        await db.execute(select(Vehicle).order_by(Vehicle.license_plate.asc()))
    ).scalars().all()

    assignment_rows = (
        await db.execute(
            select(VehicleAssignment, User)
            .join(User, User.id == VehicleAssignment.user_id)
            .where(VehicleAssignment.status == AssignmentStatus.ACTIVE)
        )
    ).all()

    assignment_map: dict[int, tuple[VehicleAssignment, User]] = {}

    for assignment, user in assignment_rows:
        assignment_map.setdefault(assignment.vehicle_id, (assignment, user))

    return VehicleLiveStatusResponseSchema(
        vehicles=[
            {
                "vehicle_id": vehicle.id,
                "brand": vehicle.brand,
                "model": vehicle.model,
                "license_plate": vehicle.license_plate,
                "vehicle_status": vehicle.status,
                "availability": "occupied" if vehicle.id in assignment_map else "free",
                "assigned_to_user_id": assignment_map[vehicle.id][0].user_id
                if vehicle.id in assignment_map
                else None,
                "assigned_to_name": assignment_map[vehicle.id][1].full_name
                if vehicle.id in assignment_map
                else None,
                "assigned_to_shift_number": assignment_map[vehicle.id][1].shift_number
                if vehicle.id in assignment_map
                else None,
                "active_assignment_id": assignment_map[vehicle.id][0].id
                if vehicle.id in assignment_map
                else None,
            }
            for vehicle in vehicles
        ]
    )


@router.get("/{vehicle_id}", response_model=VehicleReadSchema)
async def get_vehicle(
    vehicle_id: int,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(require_admin),
) -> VehicleReadSchema:
    vehicle = await _get_vehicle_or_404(db, vehicle_id)
    assignment_row = await _get_active_assignment_with_user(db, vehicle.id)

    shift_number = assignment_row[1].shift_number if assignment_row else None

    return _vehicle_response(vehicle, shift_number)


@router.put("/{vehicle_id}", response_model=VehicleReadSchema)
async def update_vehicle(
    vehicle_id: int,
    payload: VehicleUpdateSchema,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(require_admin),
) -> VehicleReadSchema:
    vehicle = await _get_vehicle_or_404(db, vehicle_id)
    data = payload.model_dump(exclude_unset=True)

    if data.get("brand") is not None:
        data["brand"] = _normalize_vehicle_name(data["brand"])

    if data.get("model") is not None:
        data["model"] = _normalize_vehicle_name(data["model"])

    if data.get("license_plate") is not None:
        data["license_plate"] = _normalize_license_plate(data["license_plate"])
        await _ensure_unique_license_plate(db, data["license_plate"], vehicle_id)

    for field, value in data.items():
        setattr(vehicle, field, value)

    await db.commit()
    await db.refresh(vehicle)

    assignment_row = await _get_active_assignment_with_user(db, vehicle.id)
    shift_number = assignment_row[1].shift_number if assignment_row else None

    return _vehicle_response(vehicle, shift_number)


@router.delete("/{vehicle_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_vehicle(
    vehicle_id: int,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(require_admin),
) -> Response:
    vehicle = await _get_vehicle_or_404(db, vehicle_id)

    if await _vehicle_has_active_assignment(db, vehicle_id):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Vehicle is currently assigned.",
        )

    await db.delete(vehicle)
    await db.commit()

    return Response(status_code=status.HTTP_204_NO_CONTENT)


@router.post("/{vehicle_id}/photos")
async def upload_vehicle_photos(
    vehicle_id: int,
    files: list[UploadFile] = File(...),
    type: VehiclePhotoType = Form(...),
    db: AsyncSession = Depends(get_db),
    _: User = Depends(require_admin),
):
    vehicle = await _get_vehicle_or_404(db, vehicle_id)

    vehicle_folder = UPLOAD_DIR / f"vehicle_{vehicle.id}"
    vehicle_folder.mkdir(parents=True, exist_ok=True)

    for file in files:
        file_ext = os.path.splitext(file.filename or "")[1]
        file_name = f"{type.value}_{os.urandom(6).hex()}{file_ext}"
        file_path = vehicle_folder / file_name

        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)

        db.add(
            VehiclePhoto(
                vehicle_id=vehicle.id,
                type=type,
                file_name=file_name,
                file_path=str(file_path),
                mime_type=file.content_type or "application/octet-stream",
                file_size=file.size or 0,
            )
        )

    await db.commit()

    return {"uploaded": len(files)}


@router.get("/{vehicle_id}/photos")
async def get_vehicle_photos(
    vehicle_id: int,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(require_admin),
):
    vehicle = await _get_vehicle_or_404(db, vehicle_id)

    photos = (
        await db.execute(
            select(VehiclePhoto)
            .where(VehiclePhoto.vehicle_id == vehicle.id)
            .order_by(VehiclePhoto.created_at.desc(), VehiclePhoto.id.desc())
        )
    ).scalars().all()

    return [
        {
            "id": photo.id,
            "type": photo.type.value,
            "file_name": photo.file_name,
            "mime_type": photo.mime_type,
            "file_size": photo.file_size,
            "created_at": photo.created_at,
        }
        for photo in photos
    ]


@router.get("/photos/{photo_id}/file")
async def get_vehicle_photo_file(
    photo_id: int,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(require_admin),
):
    photo = (
        await db.execute(select(VehiclePhoto).where(VehiclePhoto.id == photo_id))
    ).scalar_one_or_none()

    if photo is None:
        raise HTTPException(status_code=404, detail="Photo not found.")

    return FileResponse(
        photo.file_path,
        media_type=photo.mime_type,
        filename=photo.file_name,
    )