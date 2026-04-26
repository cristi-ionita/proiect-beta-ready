from __future__ import annotations

from datetime import UTC, datetime

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.models.user import User
from app.db.models.vehicle import Vehicle, VehicleStatus
from app.db.models.vehicle_assignment import AssignmentStatus, VehicleAssignment
from app.schemas.user import UserRole, UserStatus
from app.schemas.vehicle_assignment_admin import VehicleAssignmentReadSchema


class VehicleAssignmentService:
    @staticmethod
    async def get_user_or_404(
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

    @staticmethod
    async def get_vehicle_or_404(
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

    @staticmethod
    async def get_assignment_or_404(
        db: AsyncSession,
        assignment_id: int,
    ) -> VehicleAssignment:
        assignment = (
            await db.execute(
                select(VehicleAssignment).where(
                    VehicleAssignment.id == assignment_id
                )
            )
        ).scalar_one_or_none()

        if assignment is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Assignment not found.",
            )

        return assignment

    @staticmethod
    async def get_open_assignment_for_user(
        db: AsyncSession,
        user_id: int,
    ) -> VehicleAssignment | None:
        return (
            await db.execute(
                select(VehicleAssignment).where(
                    VehicleAssignment.user_id == user_id,
                    VehicleAssignment.status.in_(
                        [AssignmentStatus.PENDING, AssignmentStatus.ACTIVE]
                    ),
                )
            )
        ).scalar_one_or_none()

    @staticmethod
    async def get_open_assignment_for_vehicle(
        db: AsyncSession,
        vehicle_id: int,
    ) -> VehicleAssignment | None:
        return (
            await db.execute(
                select(VehicleAssignment).where(
                    VehicleAssignment.vehicle_id == vehicle_id,
                    VehicleAssignment.status.in_(
                        [AssignmentStatus.PENDING, AssignmentStatus.ACTIVE]
                    ),
                )
            )
        ).scalar_one_or_none()

    @staticmethod
    def build_assignment_read(
        assignment: VehicleAssignment,
        user: User,
        vehicle: Vehicle,
    ) -> VehicleAssignmentReadSchema:
        return VehicleAssignmentReadSchema(
            id=assignment.id,
            user_id=user.id,
            user_name=user.full_name,
            vehicle_id=vehicle.id,
            vehicle_license_plate=vehicle.license_plate,
            vehicle_brand=vehicle.brand,
            vehicle_model=vehicle.model,
            shift_number=assignment.shift_number,
            status=assignment.status.value,
            started_at=assignment.started_at,
            ended_at=assignment.ended_at,
        )

    @staticmethod
    async def create_assignment(
        db: AsyncSession,
        user: User,
        vehicle: Vehicle,
        shift_number: int,
    ) -> VehicleAssignment:
        if user.role != UserRole.EMPLOYEE.value:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Vehicle can only be assigned to an employee.",
            )

        if not user.is_active:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="User must be active.",
            )

        if user.status != UserStatus.APPROVED.value:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="User must be approved.",
            )

        if vehicle.status != VehicleStatus.AVAILABLE:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Vehicle is not available for assignment.",
            )

        if shift_number <= 0:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Shift number must be greater than 0.",
            )

        existing_user_assignment = (
            await VehicleAssignmentService.get_open_assignment_for_user(
                db,
                user.id,
            )
        )
        if existing_user_assignment is not None:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="User already has a pending or active vehicle assignment.",
            )

        existing_vehicle_assignment = (
            await VehicleAssignmentService.get_open_assignment_for_vehicle(
                db,
                vehicle.id,
            )
        )
        if existing_vehicle_assignment is not None:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Vehicle already has a pending or active assignment.",
            )

        assignment = VehicleAssignment(
            user_id=user.id,
            vehicle_id=vehicle.id,
            shift_number=shift_number,
            status=AssignmentStatus.PENDING,
        )

        vehicle.status = VehicleStatus.ASSIGNED

        db.add(assignment)
        await db.commit()
        await db.refresh(assignment)

        return assignment

    @staticmethod
    async def close_assignment(
        db: AsyncSession,
        assignment: VehicleAssignment,
    ) -> VehicleAssignment:
        if assignment.status not in [AssignmentStatus.PENDING, AssignmentStatus.ACTIVE]:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Only pending or active assignments can be closed.",
            )

        assignment.status = AssignmentStatus.CLOSED
        assignment.ended_at = datetime.now(UTC)

        vehicle = await VehicleAssignmentService.get_vehicle_or_404(
            db,
            assignment.vehicle_id,
        )

        if vehicle.status == VehicleStatus.ASSIGNED:
            vehicle.status = VehicleStatus.AVAILABLE

        await db.commit()
        await db.refresh(assignment)

        return assignment

    @staticmethod
    async def delete_assignment(
        db: AsyncSession,
        assignment: VehicleAssignment,
    ) -> None:
        vehicle = await VehicleAssignmentService.get_vehicle_or_404(
            db,
            assignment.vehicle_id,
        )

        if vehicle.status == VehicleStatus.ASSIGNED:
            vehicle.status = VehicleStatus.AVAILABLE

        await db.delete(assignment)
        await db.commit()