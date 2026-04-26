from __future__ import annotations

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.models.employee_profile import EmployeeProfile
from app.db.models.user import User
from app.schemas.employee_profile import (
    EmployeeProfileCreateSchema,
    EmployeeProfileUpdateSchema,
)


class EmployeeProfileService:
    @staticmethod
    async def get_by_user_id(
        db: AsyncSession,
        user_id: int,
    ) -> EmployeeProfile | None:
        result = await db.execute(
            select(EmployeeProfile).where(EmployeeProfile.user_id == user_id)
        )
        return result.scalar_one_or_none()

    @staticmethod
    async def ensure_user_exists(
        db: AsyncSession,
        user_id: int,
    ) -> User:
        user = await db.get(User, user_id)

        if user is None:
            raise ValueError("User not found.")

        return user

    @staticmethod
    async def ensure_employee_user(
        db: AsyncSession,
        user_id: int,
    ) -> User:
        user = await EmployeeProfileService.ensure_user_exists(db, user_id)

        if user.role != "employee":
            raise ValueError("Employee profile can only be assigned to an employee.")

        return user

    @staticmethod
    async def create(
        db: AsyncSession,
        payload: EmployeeProfileCreateSchema,
    ) -> EmployeeProfile:
        await EmployeeProfileService.ensure_employee_user(db, payload.user_id)

        existing_profile = await EmployeeProfileService.get_by_user_id(
            db,
            payload.user_id,
        )
        if existing_profile is not None:
            raise ValueError("Employee profile already exists for this user.")

        profile = EmployeeProfile(
            user_id=payload.user_id,
            first_name=payload.first_name,
            last_name=payload.last_name,
            phone=payload.phone,
            address=payload.address,
            position=payload.position,
            department=payload.department,
            hire_date=payload.hire_date,
            iban=payload.iban,
            emergency_contact_name=payload.emergency_contact_name,
            emergency_contact_phone=payload.emergency_contact_phone,
        )

        db.add(profile)
        await db.flush()
        await db.refresh(profile)

        return profile

    @staticmethod
    async def update(
        db: AsyncSession,
        profile: EmployeeProfile,
        payload: EmployeeProfileUpdateSchema,
    ) -> EmployeeProfile:
        update_data = payload.model_dump(exclude_unset=True)

        for field_name, value in update_data.items():
            setattr(profile, field_name, value)

        await db.flush()
        await db.refresh(profile)

        return profile