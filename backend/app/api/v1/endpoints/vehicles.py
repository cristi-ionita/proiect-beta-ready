from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, Response, status
from fastapi.responses import FileResponse
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.v1.dependencies import require_admin
from app.db.models.user import User
from app.db.models.vehicle import Vehicle
from app.db.models.vehicle_assignment import AssignmentStatus, VehicleAssignment
from app.db.session import get_db
from app.schemas.vehicle import (
    VehicleCreateSchema,
    VehicleReadSchema,
    VehicleUpdateSchema,
)
from app.schemas.vehicle_live_status import VehicleLiveStatusResponseSchema
from fastapi import UploadFile, File, Form
from pathlib import Path
import shutil
import os

from app.db.models.vehicle_photo import VehiclePhoto, VehiclePhotoType

router = APIRouter(prefix="/vehicles", tags=["vehicles"])
UPLOAD_DIR = Path("uploads/vehicles")
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)



def _normalize_license_plate(value: str) -> str:
    cleaned = " ".join(value.strip().split()).upper()
    if not cleaned:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="License plate is required.",
        )
    return cleaned


def _normalize_vin(value: str | None) -> str | None:
    if value is None:
        return None

    cleaned = value.strip().upper()
    return cleaned or None


async def _get_vehicle_or_404(
    db: AsyncSession,
    vehicle_id: int,
) -> Vehicle:
    vehicle = (
        await db.execute(select(Vehicle).where(Vehicle.id == vehicle_id))
    ).scalar_one_or_none()

    if vehicle is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Vehicle not found.",
        )

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
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="License plate already exists.",
        )


async def _ensure_unique_vin(
    db: AsyncSession,
    vin: str | None,
    exclude_id: int | None = None,
) -> None:
    if not vin:
        return

    query = select(Vehicle).where(Vehicle.vin == vin)

    if exclude_id is not None:
        query = query.where(Vehicle.id != exclude_id)

    existing = (await db.execute(query)).scalar_one_or_none()
    if existing is not None:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="VIN already exists.",
        )


async def _has_active_assignment(
    db: AsyncSession,
    vehicle_id: int,
) -> bool:
    result = await db.execute(
        select(VehicleAssignment.id).where(
            VehicleAssignment.vehicle_id == vehicle_id,
            VehicleAssignment.status == AssignmentStatus.ACTIVE,
        )
    )
    return result.scalar_one_or_none() is not None


@router.post("", response_model=VehicleReadSchema, status_code=status.HTTP_201_CREATED)
async def create_vehicle(
    payload: VehicleCreateSchema,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(require_admin),
) -> VehicleReadSchema:
    data = payload.model_dump()
    data["license_plate"] = _normalize_license_plate(payload.license_plate)
    data["vin"] = _normalize_vin(payload.vin)

    await _ensure_unique_license_plate(db, data["license_plate"])
    await _ensure_unique_vin(db, data["vin"])

    vehicle = Vehicle(**data)

    db.add(vehicle)
    await db.commit()
    await db.refresh(vehicle)

    return VehicleReadSchema.model_validate(vehicle)


@router.get("", response_model=list[VehicleReadSchema])
async def list_vehicles(
    db: AsyncSession = Depends(get_db),
    _: User = Depends(require_admin),
) -> list[VehicleReadSchema]:
    result = await db.execute(select(Vehicle).order_by(Vehicle.id.desc()))
    return [
        VehicleReadSchema.model_validate(vehicle)
        for vehicle in result.scalars().all()
    ]


@router.get("/live-status", response_model=VehicleLiveStatusResponseSchema)
async def get_live_status(
    db: AsyncSession = Depends(get_db),
    _: User = Depends(require_admin),
) -> VehicleLiveStatusResponseSchema:
    vehicles = (
        await db.execute(select(Vehicle).order_by(Vehicle.license_plate.asc()))
    ).scalars().all()

    active_assignments = (
        await db.execute(
            select(VehicleAssignment).where(
                VehicleAssignment.status == AssignmentStatus.ACTIVE
            )
        )
    ).scalars().all()

    active_map: dict[int, VehicleAssignment] = {}

    for assignment in active_assignments:
        if assignment.vehicle_id not in active_map:
            await db.refresh(assignment, attribute_names=["user"])
            active_map[assignment.vehicle_id] = assignment

    response_items: list[dict[str, object | None]] = []

    for vehicle in vehicles:
        assignment = active_map.get(vehicle.id)

        response_items.append(
            {
                "vehicle_id": vehicle.id,
                "brand": vehicle.brand,
                "model": vehicle.model,
                "license_plate": vehicle.license_plate,
                "year": vehicle.year,
                "vehicle_status": vehicle.status.value,
                "availability": "occupied" if assignment else "free",
                "assigned_to_user_id": assignment.user_id if assignment else None,
                "assigned_to_name": assignment.user.full_name if assignment else None,
                "assigned_to_shift_number": assignment.user.shift_number if assignment else None,
                "active_assignment_id": assignment.id if assignment else None,
            }
        )

    return VehicleLiveStatusResponseSchema(vehicles=response_items)


@router.get("/{vehicle_id}", response_model=VehicleReadSchema)
async def get_vehicle(
    vehicle_id: int,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(require_admin),
) -> VehicleReadSchema:
    vehicle = await _get_vehicle_or_404(db, vehicle_id)
    return VehicleReadSchema.model_validate(vehicle)


@router.put("/{vehicle_id}", response_model=VehicleReadSchema)
async def update_vehicle(
    vehicle_id: int,
    payload: VehicleUpdateSchema,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(require_admin),
) -> VehicleReadSchema:
    vehicle = await _get_vehicle_or_404(db, vehicle_id)
    data = payload.model_dump(exclude_unset=True)

    if "license_plate" in data and data["license_plate"] is not None:
        data["license_plate"] = _normalize_license_plate(data["license_plate"])
        await _ensure_unique_license_plate(db, data["license_plate"], vehicle_id)

    if "vin" in data:
        data["vin"] = _normalize_vin(data["vin"])
        await _ensure_unique_vin(db, data["vin"], vehicle_id)

    for field, value in data.items():
        setattr(vehicle, field, value)

    await db.commit()
    await db.refresh(vehicle)

    return VehicleReadSchema.model_validate(vehicle)


@router.delete("/{vehicle_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_vehicle(
    vehicle_id: int,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(require_admin),
) -> Response:
    vehicle = await _get_vehicle_or_404(db, vehicle_id)

    if await _has_active_assignment(db, vehicle_id):
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

    saved_files = []

    vehicle_folder = UPLOAD_DIR / f"vehicle_{vehicle_id}"
    vehicle_folder.mkdir(parents=True, exist_ok=True)

    for file in files:
        file_ext = os.path.splitext(file.filename)[1]
        file_name = f"{type.value}_{os.urandom(6).hex()}{file_ext}"
        file_path = vehicle_folder / file_name

        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)

        photo = VehiclePhoto(
            vehicle_id=vehicle.id,
            type=type,
            file_name=file_name,
            file_path=str(file_path),
            mime_type=file.content_type or "application/octet-stream",
            file_size=file.size or 0,
        )

        db.add(photo)
        saved_files.append(photo)

    await db.commit()

    return {"uploaded": len(saved_files)}

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
        await db.execute(
            select(VehiclePhoto).where(VehiclePhoto.id == photo_id)
        )
    ).scalar_one_or_none()

    if photo is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Photo not found.",
        )

    return FileResponse(
        photo.file_path,
        media_type=photo.mime_type,
        filename=photo.file_name,
    )