from __future__ import annotations

from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.v1.dependencies import require_admin
from app.db.models.registration_request import RegistrationRequest
from app.db.models.user import User
from app.db.session import get_db
from app.schemas.registration_request import (
    PendingRegistrationRequestListItemSchema,
    RegistrationRequestStatus,
)
from app.schemas.user import UserReadSchema, UserRole, UserStatus

router = APIRouter(prefix="/users", tags=["users"])


def _parse_role(value: str | None) -> str | None:
    if value is None:
        return None

    try:
        return UserRole(value.strip().lower()).value
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid role.",
        ) from exc


def _parse_status(value: str | None) -> str | None:
    if value is None:
        return None

    try:
        return UserStatus(value.strip().lower()).value
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid status.",
        ) from exc


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


async def _get_registration_request_or_404(
    db: AsyncSession,
    request_id: int,
) -> RegistrationRequest:
    request = (
        await db.execute(
            select(RegistrationRequest).where(RegistrationRequest.id == request_id)
        )
    ).scalar_one_or_none()

    if request is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Registration request not found.",
        )

    return request


async def _ensure_shift_free(
    db: AsyncSession,
    shift: str,
    exclude_id: int | None = None,
) -> None:
    query = select(User).where(
        User.shift_number == shift,
        User.is_active.is_(True),
        User.role == UserRole.EMPLOYEE.value,
        User.status == UserStatus.APPROVED.value,
    )

    if exclude_id is not None:
        query = query.where(User.id != exclude_id)

    existing = (await db.execute(query)).scalar_one_or_none()

    if existing is not None:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Shift is already assigned.",
        )


async def _ensure_user_uniqueness_from_request(
    db: AsyncSession,
    request: RegistrationRequest,
) -> None:
    filters = []

    if request.email:
        filters.append(User.email == request.email)
    if request.username:
        filters.append(User.username == request.username)
    if request.unique_code:
        filters.append(User.unique_code == request.unique_code)

    if not filters:
        return

    existing_user = (
        await db.execute(select(User).where(or_(*filters)))
    ).scalar_one_or_none()

    if existing_user is not None:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="A user with the same email, username, or unique_code already exists.",
        )


@router.get("", response_model=list[UserReadSchema])
async def list_users(
    active_only: bool = Query(False),
    role: str | None = Query(None),
    status_filter: str | None = Query(None, alias="status"),
    db: AsyncSession = Depends(get_db),
    _: User = Depends(require_admin),
) -> list[UserReadSchema]:
    query = select(User)

    if active_only:
        query = query.where(User.is_active.is_(True))

    normalized_role = _parse_role(role)
    if normalized_role is not None:
        query = query.where(User.role == normalized_role)

    normalized_status = _parse_status(status_filter)
    if normalized_status is not None:
        query = query.where(User.status == normalized_status)

    users = (
        await db.execute(query.order_by(User.full_name.asc(), User.id.asc()))
    ).scalars().all()

    return [UserReadSchema.model_validate(user) for user in users]


@router.get(
    "/pending",
    response_model=list[PendingRegistrationRequestListItemSchema],
)
async def list_pending_users(
    db: AsyncSession = Depends(get_db),
    _: User = Depends(require_admin),
) -> list[PendingRegistrationRequestListItemSchema]:
    requests = (
        await db.execute(
            select(RegistrationRequest)
            .where(RegistrationRequest.status == RegistrationRequestStatus.PENDING.value)
            .order_by(RegistrationRequest.created_at.asc(), RegistrationRequest.id.asc())
        )
    ).scalars().all()

    return [
        PendingRegistrationRequestListItemSchema.model_validate(request)
        for request in requests
    ]


@router.get("/{user_id}", response_model=UserReadSchema)
async def get_user(
    user_id: int,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(require_admin),
) -> UserReadSchema:
    user = await _get_user_or_404(db, user_id)
    return UserReadSchema.model_validate(user)


@router.patch("/{user_id}/activate", response_model=UserReadSchema)
async def activate_user(
    user_id: int,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(require_admin),
) -> UserReadSchema:
    user = await _get_user_or_404(db, user_id)

    if user.role == UserRole.EMPLOYEE.value and user.shift_number:
        await _ensure_shift_free(db, user.shift_number, user.id)

    user.is_active = True

    if user.status == UserStatus.SUSPENDED.value:
        user.status = UserStatus.APPROVED.value

    await db.commit()
    await db.refresh(user)

    return UserReadSchema.model_validate(user)


@router.patch("/{user_id}/deactivate", response_model=UserReadSchema)
async def deactivate_user(
    user_id: int,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(require_admin),
) -> UserReadSchema:
    user = await _get_user_or_404(db, user_id)

    if user.role == UserRole.ADMIN.value:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Admin user cannot be deactivated here.",
        )

    user.is_active = False
    user.status = UserStatus.SUSPENDED.value

    await db.commit()
    await db.refresh(user)

    return UserReadSchema.model_validate(user)


@router.patch("/{user_id}/approve", response_model=UserReadSchema)
async def approve_user(
    user_id: int,
    db: AsyncSession = Depends(get_db),
    admin_user: User = Depends(require_admin),
) -> UserReadSchema:
    request = await _get_registration_request_or_404(db, user_id)

    if request.role == UserRole.ADMIN.value:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Admin registration request cannot be approved.",
        )

    if request.status != RegistrationRequestStatus.PENDING.value:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only pending registration requests can be approved.",
        )

    if request.email and request.email_verified_at is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email must be verified before approval.",
        )

    if request.role == UserRole.EMPLOYEE.value and request.shift_number:
        await _ensure_shift_free(db, request.shift_number)

    await _ensure_user_uniqueness_from_request(db, request)

    now = datetime.now(timezone.utc)

    user = User(
        full_name=request.full_name,
        email=request.email,
        unique_code=request.unique_code,
        username=request.username,
        shift_number=request.shift_number,
        password_hash=request.password_hash,
        role=request.role,
        status=UserStatus.APPROVED.value,
        is_active=True,
        approved_at=now,
        approved_by_user_id=admin_user.id,
        rejected_at=None,
        rejected_by_user_id=None,
        rejection_reason=None,
    )

    db.add(user)

    request.status = RegistrationRequestStatus.APPROVED.value
    request.approved_at = now
    request.approved_by_user_id = admin_user.id
    request.rejected_at = None
    request.rejected_by_user_id = None
    request.rejection_reason = None

    await db.commit()
    await db.refresh(user)

    return UserReadSchema.model_validate(user)


@router.patch("/{user_id}/reject", status_code=status.HTTP_204_NO_CONTENT)
async def reject_user(
    user_id: int,
    db: AsyncSession = Depends(get_db),
    admin_user: User = Depends(require_admin),
):
    request = await _get_registration_request_or_404(db, user_id)

    if request.role == UserRole.ADMIN.value:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Admin registration request cannot be rejected.",
        )

    if request.status != RegistrationRequestStatus.PENDING.value:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only pending registration requests can be rejected.",
        )

    request.status = RegistrationRequestStatus.REJECTED.value
    request.rejected_at = datetime.now(timezone.utc)
    request.rejected_by_user_id = admin_user.id

    await db.commit()

    return None


@router.patch("/{user_id}/suspend", response_model=UserReadSchema)
async def suspend_user(
    user_id: int,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(require_admin),
) -> UserReadSchema:
    user = await _get_user_or_404(db, user_id)

    if user.role == UserRole.ADMIN.value:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Admin user cannot be suspended here.",
        )

    user.status = UserStatus.SUSPENDED.value
    user.is_active = False

    await db.commit()
    await db.refresh(user)

    return UserReadSchema.model_validate(user)

@router.patch("/{user_id}/shift", response_model=UserReadSchema)
async def update_user_shift(
    user_id: int,
    shift: int = Query(..., ge=1),
    db: AsyncSession = Depends(get_db),
    _: User = Depends(require_admin),
) -> UserReadSchema:
    user = await _get_user_or_404(db, user_id)

    if user.role != UserRole.EMPLOYEE.value:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Shift can only be assigned to employees.",
        )

    if user.status != UserStatus.APPROVED.value:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User must be approved before assigning shift.",
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Inactive users cannot receive a shift.",
        )

    shift_value = str(shift)

    await _ensure_shift_free(db, shift_value, user.id)

    user.shift_number = shift_value

    await db.commit()
    await db.refresh(user)

    return UserReadSchema.model_validate(user)