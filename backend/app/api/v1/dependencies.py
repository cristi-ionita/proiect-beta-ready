from __future__ import annotations

from typing import Final

from fastapi import Depends, HTTPException, Path, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import decode_access_token
from app.db.models.user import User
from app.db.models.vehicle_assignment import AssignmentStatus, VehicleAssignment
from app.db.session import get_db
from app.schemas.user import UserRole, UserStatus

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/login")

WWW_AUTHENTICATE_HEADER: Final[dict[str, str]] = {"WWW-Authenticate": "Bearer"}


def _raise_unauthorized(
    detail: str = "Invalid or expired authentication token",
) -> None:
    raise HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail=detail,
        headers=WWW_AUTHENTICATE_HEADER,
    )


def _raise_forbidden(detail: str) -> None:
    raise HTTPException(
        status_code=status.HTTP_403_FORBIDDEN,
        detail=detail,
    )


async def get_current_user(
    db: AsyncSession = Depends(get_db),
    token: str = Depends(oauth2_scheme),
) -> User:
    try:
        payload = decode_access_token(token)
    except ValueError as exc:
        _raise_unauthorized(str(exc))

    subject = payload.get("sub")

    if subject is None:
        _raise_unauthorized("Authentication token is missing subject.")

    try:
        user_id = int(subject)
    except (TypeError, ValueError):
        _raise_unauthorized("Authentication token subject is invalid.")

    user = await db.get(User, user_id)

    if user is None:
        _raise_unauthorized("Authenticated user no longer exists.")

    return user


async def require_active_user(
    current_user: User = Depends(get_current_user),
) -> User:
    if not current_user.is_active:
        _raise_forbidden("Inactive user account.")

    return current_user


async def require_approved_user(
    current_user: User = Depends(require_active_user),
) -> User:
    if current_user.status != UserStatus.APPROVED.value:
        _raise_forbidden("User account is not approved.")

    return current_user


async def require_active_approved_user(
    current_user: User = Depends(require_approved_user),
) -> User:
    return current_user


def _require_role(
    required_role: UserRole,
    current_user: User,
) -> User:
    if current_user.role != required_role.value:
        readable_role = required_role.value.capitalize()
        _raise_forbidden(f"{readable_role} access required.")

    return current_user


async def require_admin(
    current_user: User = Depends(require_active_approved_user),
) -> User:
    return _require_role(UserRole.ADMIN, current_user)


async def require_employee(
    current_user: User = Depends(require_active_approved_user),
) -> User:
    return _require_role(UserRole.EMPLOYEE, current_user)


async def require_mechanic(
    current_user: User = Depends(require_active_approved_user),
) -> User:
    return _require_role(UserRole.MECHANIC, current_user)


async def get_current_active_assignment(
    assignment_id: int = Path(..., gt=0),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_active_approved_user),
) -> VehicleAssignment:
    assignment = (
        await db.execute(
            select(VehicleAssignment).where(
                VehicleAssignment.id == assignment_id,
                VehicleAssignment.user_id == current_user.id,
                VehicleAssignment.status == AssignmentStatus.ACTIVE,
            )
        )
    ).scalar_one_or_none()

    if assignment is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Active assignment not found.",
        )

    return assignment