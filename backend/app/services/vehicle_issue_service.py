from __future__ import annotations

from datetime import UTC, datetime

from fastapi import HTTPException, status
from sqlalchemy import desc, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.db.models.user import User
from app.db.models.vehicle import Vehicle
from app.db.models.vehicle_assignment import AssignmentStatus, VehicleAssignment
from app.db.models.vehicle_issue import VehicleIssue, VehicleIssueStatus
from app.schemas.user import UserRole
from app.schemas.vehicle_issue import (
    VehicleIssueCreateRequestSchema,
    VehicleIssueListResponseSchema,
    VehicleIssueReadSchema,
    VehicleIssueUpdateRequestSchema,
)


class VehicleIssueService:
    @staticmethod
    def normalize_optional_text(value: str | None) -> str | None:
        if value is None:
            return None

        cleaned = " ".join(value.strip().split())
        return cleaned or None

    @staticmethod
    def validate_create_payload(payload: VehicleIssueCreateRequestSchema) -> None:
        has_any_issue = any(
            [
                payload.need_service_in_km is not None,
                payload.need_brakes,
                payload.need_tires,
                payload.need_oil,
                bool(VehicleIssueService.normalize_optional_text(payload.dashboard_checks)),
                bool(VehicleIssueService.normalize_optional_text(payload.other_problems)),
                payload.has_photos,
            ]
        )

        if not has_any_issue:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="At least one issue or photo must be provided.",
            )

    @staticmethod
    def validate_status_transition(
        issue: VehicleIssue,
        next_status: VehicleIssueStatus,
    ) -> None:
        allowed: dict[VehicleIssueStatus, set[VehicleIssueStatus]] = {
            VehicleIssueStatus.OPEN: {
                VehicleIssueStatus.SCHEDULED,
                VehicleIssueStatus.IN_PROGRESS,
                VehicleIssueStatus.RESOLVED,
                VehicleIssueStatus.CANCELED,
            },
            VehicleIssueStatus.SCHEDULED: {
                VehicleIssueStatus.IN_PROGRESS,
                VehicleIssueStatus.RESOLVED,
                VehicleIssueStatus.CANCELED,
            },
            VehicleIssueStatus.IN_PROGRESS: {
                VehicleIssueStatus.RESOLVED,
                VehicleIssueStatus.CANCELED,
            },
            VehicleIssueStatus.RESOLVED: set(),
            VehicleIssueStatus.CANCELED: set(),
        }

        current_status = issue.status

        if next_status == current_status:
            return

        if next_status not in allowed[current_status]:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid status transition from {current_status.value} to {next_status.value}.",
            )

    @staticmethod
    async def get_issue_or_404(db: AsyncSession, issue_id: int) -> VehicleIssue:
        issue = (
            await db.execute(
                select(VehicleIssue)
                .options(
                    selectinload(VehicleIssue.photos),
                    selectinload(VehicleIssue.reported_by_user),
                    selectinload(VehicleIssue.vehicle),
                )
                .where(VehicleIssue.id == issue_id)
            )
        ).scalar_one_or_none()

        if issue is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Issue not found.",
            )

        return issue

    @staticmethod
    async def get_vehicle_or_404(db: AsyncSession, vehicle_id: int) -> Vehicle:
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
    async def get_user_or_404(db: AsyncSession, user_id: int) -> User:
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
    async def get_active_assignment_for_user(
        db: AsyncSession,
        user_id: int,
    ) -> VehicleAssignment | None:
        return (
            await db.execute(
                select(VehicleAssignment).where(
                    VehicleAssignment.user_id == user_id,
                    VehicleAssignment.status == AssignmentStatus.ACTIVE,
                    VehicleAssignment.ended_at.is_(None),
                )
            )
        ).scalar_one_or_none()

    @staticmethod
    async def create_issue(
        db: AsyncSession,
        current_user: User,
        payload: VehicleIssueCreateRequestSchema,
    ) -> VehicleIssue:
        assignment = await VehicleIssueService.get_active_assignment_for_user(
            db,
            current_user.id,
        )

        if assignment is None:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="No active vehicle assignment found.",
            )

        VehicleIssueService.validate_create_payload(payload)

        issue = VehicleIssue(
            vehicle_id=assignment.vehicle_id,
            assignment_id=assignment.id,
            reported_by_user_id=current_user.id,
            priority=payload.priority,
            need_service_in_km=payload.need_service_in_km,
            need_brakes=payload.need_brakes,
            need_tires=payload.need_tires,
            need_oil=payload.need_oil,
            dashboard_checks=VehicleIssueService.normalize_optional_text(
                payload.dashboard_checks
            ),
            other_problems=VehicleIssueService.normalize_optional_text(
                payload.other_problems
            ),
            status=VehicleIssueStatus.OPEN,
        )

        db.add(issue)
        await db.commit()
        await db.refresh(issue)

        return issue

    @staticmethod
    async def hydrate_issue(
        db: AsyncSession,
        issue: VehicleIssue,
    ) -> VehicleIssue:
        refreshed = (
            await db.execute(
                select(VehicleIssue)
                .options(
                    selectinload(VehicleIssue.photos),
                    selectinload(VehicleIssue.reported_by_user),
                    selectinload(VehicleIssue.vehicle),
                )
                .where(VehicleIssue.id == issue.id)
            )
        ).scalar_one()

        issue.photos = refreshed.photos
        issue.reported_by_user = refreshed.reported_by_user
        issue.vehicle = refreshed.vehicle

        return issue

    @staticmethod
    def serialize_issue(issue: VehicleIssue) -> VehicleIssueReadSchema:
        return VehicleIssueReadSchema(
            id=issue.id,
            vehicle_id=issue.vehicle_id,
            vehicle_license_plate=issue.vehicle.license_plate if issue.vehicle else None,
            vehicle_brand=issue.vehicle.brand if issue.vehicle else None,
            vehicle_model=issue.vehicle.model if issue.vehicle else None,
            assignment_id=issue.assignment_id,
            reported_by_user_id=issue.reported_by_user_id,
            reported_by_name=(
                issue.reported_by_user.full_name if issue.reported_by_user else None
            ),
            reported_by_shift_number=(
                issue.reported_by_user.shift_number if issue.reported_by_user else None
            ),
            assigned_mechanic_id=issue.assigned_mechanic_id,
            priority=issue.priority,
            need_service_in_km=issue.need_service_in_km,
            need_brakes=issue.need_brakes,
            need_tires=issue.need_tires,
            need_oil=issue.need_oil,
            dashboard_checks=issue.dashboard_checks,
            other_problems=issue.other_problems,
            status=issue.status,
            scheduled_for=issue.scheduled_for,
            scheduled_location=issue.scheduled_location,
            started_at=issue.started_at,
            resolved_at=issue.resolved_at,
            resolution_notes=issue.resolution_notes,
            estimated_cost=issue.estimated_cost,
            final_cost=issue.final_cost,
            created_at=issue.created_at,
            updated_at=issue.updated_at,
            photos=issue.photos or [],
        )

    @staticmethod
    async def list_issues_by_reporter(
        db: AsyncSession,
        reporter_user_id: int,
    ) -> VehicleIssueListResponseSchema:
        issues = (
            await db.execute(
                select(VehicleIssue)
                .options(
                    selectinload(VehicleIssue.photos),
                    selectinload(VehicleIssue.reported_by_user),
                    selectinload(VehicleIssue.vehicle),
                )
                .where(VehicleIssue.reported_by_user_id == reporter_user_id)
                .order_by(desc(VehicleIssue.created_at), desc(VehicleIssue.id))
            )
        ).scalars().all()

        return VehicleIssueListResponseSchema(
            issues=[VehicleIssueService.serialize_issue(issue) for issue in issues]
        )

    @staticmethod
    async def list_issues_by_mechanic(
        db: AsyncSession,
        mechanic_user_id: int,
    ) -> VehicleIssueListResponseSchema:
        issues = (
            await db.execute(
                select(VehicleIssue)
                .options(
                    selectinload(VehicleIssue.photos),
                    selectinload(VehicleIssue.reported_by_user),
                    selectinload(VehicleIssue.vehicle),
                )
                .where(VehicleIssue.assigned_mechanic_id == mechanic_user_id)
                .order_by(desc(VehicleIssue.created_at), desc(VehicleIssue.id))
            )
        ).scalars().all()

        return VehicleIssueListResponseSchema(
            issues=[VehicleIssueService.serialize_issue(issue) for issue in issues]
        )

    @staticmethod
    async def list_all_issues(db: AsyncSession) -> VehicleIssueListResponseSchema:
        issues = (
            await db.execute(
                select(VehicleIssue)
                .options(
                    selectinload(VehicleIssue.photos),
                    selectinload(VehicleIssue.reported_by_user),
                    selectinload(VehicleIssue.vehicle),
                )
                .order_by(desc(VehicleIssue.created_at), desc(VehicleIssue.id))
            )
        ).scalars().all()

        return VehicleIssueListResponseSchema(
            issues=[VehicleIssueService.serialize_issue(issue) for issue in issues]
        )

    @staticmethod
    async def update_issue_by_admin(
        db: AsyncSession,
        issue: VehicleIssue,
        payload: VehicleIssueUpdateRequestSchema,
    ) -> VehicleIssue:
        update_data = payload.model_dump(exclude_unset=True)

        if "assigned_mechanic_id" in update_data and update_data["assigned_mechanic_id"]:
            mechanic = await VehicleIssueService.get_user_or_404(
                db,
                update_data["assigned_mechanic_id"],
            )

            if mechanic.role != UserRole.MECHANIC.value:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Assigned user must be a mechanic.",
                )

        if "status" in update_data and update_data["status"] is not None:
            next_status = update_data["status"]
            VehicleIssueService.validate_status_transition(issue, next_status)

            now = datetime.now(UTC)

            if next_status == VehicleIssueStatus.IN_PROGRESS and issue.started_at is None:
                issue.started_at = now

            if next_status == VehicleIssueStatus.RESOLVED and issue.resolved_at is None:
                issue.resolved_at = now

        for field, value in update_data.items():
            setattr(issue, field, value)

        await db.commit()
        await db.refresh(issue)
        await VehicleIssueService.hydrate_issue(db, issue)

        return issue

    @staticmethod
    async def update_issue_by_mechanic(
        db: AsyncSession,
        issue: VehicleIssue,
        mechanic: User,
        payload: VehicleIssueUpdateRequestSchema,
    ) -> VehicleIssue:
        if issue.assigned_mechanic_id != mechanic.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Issue is not assigned to this mechanic.",
            )

        update_data = payload.model_dump(exclude_unset=True)

        forbidden_fields = {
            "assigned_mechanic_id",
            "scheduled_for",
            "scheduled_location",
            "estimated_cost",
            "priority",
        }

        if any(field in update_data for field in forbidden_fields):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Mechanic cannot update administrative issue fields.",
            )

        if "status" in update_data and update_data["status"] is not None:
            next_status = update_data["status"]
            VehicleIssueService.validate_status_transition(issue, next_status)

            now = datetime.now(UTC)

            if next_status == VehicleIssueStatus.IN_PROGRESS and issue.started_at is None:
                issue.started_at = now

            if next_status == VehicleIssueStatus.RESOLVED and issue.resolved_at is None:
                issue.resolved_at = now

        for field, value in update_data.items():
            setattr(issue, field, value)

        await db.commit()
        await db.refresh(issue)
        await VehicleIssueService.hydrate_issue(db, issue)

        return issue