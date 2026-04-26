from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, Response, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.v1.dependencies import require_admin, require_active_approved_user
from app.db.models.user import User
from app.db.session import get_db
from app.schemas.employee_profile import (
    EmployeeProfileCreateSchema,
    EmployeeProfileReadSchema,
    EmployeeProfileUpdateSchema,
)
from app.schemas.profile_summary import ProfileSummaryResponseSchema
from app.services.employee_profile_service import EmployeeProfileService
from app.services.profile_summary_service import ProfileSummaryService

router = APIRouter(prefix="/employee-profiles", tags=["employee-profiles"])


async def _get_user_or_404(
    db: AsyncSession,
    user_id: int,
) -> User:
    user = (
        await db.execute(select(User).where(User.id == user_id))
    ).scalar_one_or_none()

    if user is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found.",
        )

    return user


async def _get_profile_or_404(
    db: AsyncSession,
    user_id: int,
):
    profile = await EmployeeProfileService.get_by_user_id(db, user_id)

    if profile is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Employee profile not found.",
        )

    return profile


@router.post("", response_model=EmployeeProfileReadSchema, status_code=status.HTTP_201_CREATED)
async def create_profile(
    payload: EmployeeProfileCreateSchema,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(require_admin),
) -> EmployeeProfileReadSchema:
    user = await _get_user_or_404(db, payload.user_id)

    if user.role != "employee":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Employee profiles can only be created for employees.",
        )

    try:
        profile = await EmployeeProfileService.create(db, payload)
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(exc),
        ) from exc

    return EmployeeProfileReadSchema.model_validate(profile)


@router.get("/summary/me", response_model=ProfileSummaryResponseSchema)
async def get_my_profile_summary(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_active_approved_user),
) -> ProfileSummaryResponseSchema:
    summary = await ProfileSummaryService.get_by_user_id(db, current_user.id)

    if summary is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Profile summary not found.",
        )

    return summary


@router.get("/me", response_model=EmployeeProfileReadSchema)
async def get_my_profile(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_active_approved_user),
) -> EmployeeProfileReadSchema:
    profile = await _get_profile_or_404(db, current_user.id)
    return EmployeeProfileReadSchema.model_validate(profile)


@router.put("/me", response_model=EmployeeProfileReadSchema)
async def update_my_profile(
    payload: EmployeeProfileUpdateSchema,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_active_approved_user),
) -> EmployeeProfileReadSchema:
    profile = await EmployeeProfileService.get_by_user_id(db, current_user.id)

    try:
        if profile is None:
            create_payload = EmployeeProfileCreateSchema(
                user_id=current_user.id,
                first_name=payload.first_name or "",
                last_name=payload.last_name or "",
                phone=payload.phone,
                address=payload.address,
                position=payload.position,
                department=payload.department,
                hire_date=payload.hire_date,
                iban=payload.iban,
                emergency_contact_name=payload.emergency_contact_name,
                emergency_contact_phone=payload.emergency_contact_phone,
            )

            updated = await EmployeeProfileService.create(db, create_payload)
        else:
            updated = await EmployeeProfileService.update(db, profile, payload)

    except ValueError as exc:
        await db.rollback()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(exc),
        ) from exc

    await db.commit()
    await db.refresh(updated)

    return EmployeeProfileReadSchema.model_validate(updated)

@router.get("/{user_id}", response_model=EmployeeProfileReadSchema)
async def get_profile(
    user_id: int,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(require_admin),
) -> EmployeeProfileReadSchema:
    profile = await _get_profile_or_404(db, user_id)
    return EmployeeProfileReadSchema.model_validate(profile)


@router.put("/{user_id}", response_model=EmployeeProfileReadSchema)
async def update_profile(
    user_id: int,
    payload: EmployeeProfileUpdateSchema,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(require_admin),
) -> EmployeeProfileReadSchema:
    profile = await _get_profile_or_404(db, user_id)
    user = await _get_user_or_404(db, user_id)

    if user.role != "employee":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Employee profile can only belong to an employee.",
        )

    try:
        updated = await EmployeeProfileService.update(db, profile, payload)
    except ValueError as exc:
        await db.rollback()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(exc),
        ) from exc

    await db.commit()
    await db.refresh(updated)

    return EmployeeProfileReadSchema.model_validate(updated)