from __future__ import annotations

from datetime import UTC, datetime

from fastapi import HTTPException, status
from sqlalchemy import desc, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.models.user import User
from app.db.models.vehicle import Vehicle, VehicleStatus
from app.db.models.vehicle_assignment import AssignmentStatus, VehicleAssignment
from app.db.models.vehicle_issue import (
    VehicleIssue,
    VehicleIssueStatus,
)
from app.schemas.user import UserRole, UserStatus
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
    async def get_issue_or_404(
        db: AsyncSession,
        issue_id: int,
    ) -> VehicleIssue:
        issue = (
            await db.execute(select(VehicleIssue).where(VehicleIssue.id == issue_id))
        ).scalar_one_or_none()

        if issue is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Issue not found.",
            )

        return issue

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
    async def get_active_assignment_for_user(
        db: AsyncSession,
        user_id: int,
    ) -> VehicleAssignment | None:
        return (
            await db.execute(
                select(VehicleAssignment).where(
                    VehicleAssignment.user_id == user_id,
                    VehicleAssignment.status == AssignmentStatus.ACTIVE,
                )
            )
        ).scalar_one_or_none()

    @staticmethod
    async def get_mechanic_or_404(
        db: AsyncSession,
        mechanic_id: int,
    ) -> User:
        mechanic = (
            await db.execute(select(User).where(User.id == mechanic_id))
        ).scalar_one_or_none()

        if mechanic is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Mechanic not found.",
            )

        if mechanic.role != UserRole.MECHANIC.value:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Assigned user must have mechanic role.",
            )

        if not mechanic.is_active:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Mechanic must be active.",
            )

        if mechanic.status != UserStatus.APPROVED.value:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Mechanic must be approved.",
            )

        return mechanic

    @staticmethod
    def validate_create_payload(
        payload: VehicleIssueCreateRequestSchema,
    ) -> None:
        has_any_issue = any(
            [
                payload.need_service_in_km is not None,
                payload.need_brakes,
                payload.need_tires,
                payload.need_oil,
                bool(
                    VehicleIssueService.normalize_optional_text(
                        payload.dashboard_checks
                    )
                ),
                bool(
                    VehicleIssueService.normalize_optional_text(
                        payload.other_problems
                    )
                ),
            ]
        )

        if not has_any_issue:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="At least one issue must be provided.",
            )

    @staticmethod
    async def hydrate_issue(
        db: AsyncSession,
        issue: VehicleIssue,
    ) -> VehicleIssue:
        await db.refresh(
            issue,
            attribute_names=["vehicle", "reported_by_user", "assigned_mechanic"],
        )
        return issue

    @staticmethod
    def serialize_issue(issue: VehicleIssue) -> VehicleIssueReadSchema:
        return VehicleIssueReadSchema.model_validate(issue)

    @staticmethod
    def apply_status_side_effects(
        issue: VehicleIssue,
        vehicle: Vehicle,
    ) -> None:
        if issue.status == VehicleIssueStatus.SCHEDULED:
            vehicle.status = VehicleStatus.IN_SERVICE

        elif issue.status == VehicleIssueStatus.IN_PROGRESS:
            if issue.started_at is None:
                issue.started_at = datetime.now(UTC)
            vehicle.status = VehicleStatus.IN_SERVICE

        elif issue.status == VehicleIssueStatus.RESOLVED:
            if issue.started_at is None:
                issue.started_at = datetime.now(UTC)
            if issue.resolved_at is None:
                issue.resolved_at = datetime.now(UTC)
            if vehicle.status == VehicleStatus.IN_SERVICE:
                vehicle.status = VehicleStatus.AVAILABLE

        elif issue.status == VehicleIssueStatus.CANCELED:
            issue.scheduled_for = None
            issue.scheduled_location = None
            if vehicle.status == VehicleStatus.IN_SERVICE:
                vehicle.status = VehicleStatus.AVAILABLE

        elif issue.status == VehicleIssueStatus.OPEN:
            issue.scheduled_for = None
            issue.scheduled_location = None

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
        await VehicleIssueService.hydrate_issue(db, issue)

        return issue

    @staticmethod
    async def update_issue_by_admin(
        db: AsyncSession,
        issue: VehicleIssue,
        payload: VehicleIssueUpdateRequestSchema,
    ) -> VehicleIssue:
        vehicle = await VehicleIssueService.get_vehicle_or_404(db, issue.vehicle_id)

        if payload.status is None:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Status is required.",
            )
        VehicleIssueService.validate_status_transition(
            issue.status,
            payload.status,
        )
        issue.status = payload.status

        if payload.assigned_mechanic_id is not None:
            mechanic = await VehicleIssueService.get_mechanic_or_404(
                db,
                payload.assigned_mechanic_id,
            )
            issue.assigned_mechanic_id = mechanic.id

        if payload.priority is not None:
            issue.priority = payload.priority

        if payload.scheduled_for is not None:
            issue.scheduled_for = payload.scheduled_for

        if payload.scheduled_location is not None:
            issue.scheduled_location = VehicleIssueService.normalize_optional_text(
                payload.scheduled_location
            )

        if payload.started_at is not None:
            issue.started_at = payload.started_at

        if payload.resolved_at is not None:
            issue.resolved_at = payload.resolved_at

        if payload.resolution_notes is not None:
            issue.resolution_notes = VehicleIssueService.normalize_optional_text(
                payload.resolution_notes
            )

        if payload.estimated_cost is not None:
            issue.estimated_cost = payload.estimated_cost

        if payload.final_cost is not None:
            issue.final_cost = payload.final_cost
        VehicleIssueService.validate_status_requirements(issue)
        VehicleIssueService.apply_status_side_effects(issue, vehicle)

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
        vehicle = await VehicleIssueService.get_vehicle_or_404(db, issue.vehicle_id)

        issue.assigned_mechanic_id = mechanic.id
        

        if payload.priority is not None:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Mechanic cannot change priority.",
            )

        if payload.assigned_mechanic_id is not None:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Mechanic cannot reassign issue.",
            )

        if payload.status is not None:
            VehicleIssueService.validate_status_transition(
                issue.status,
                payload.status,
            )
            issue.status = payload.status

        if payload.scheduled_for is not None:
            issue.scheduled_for = payload.scheduled_for

        if payload.scheduled_location is not None:
            issue.scheduled_location = VehicleIssueService.normalize_optional_text(
                payload.scheduled_location
            )

        if payload.started_at is not None:
            issue.started_at = payload.started_at

        if payload.resolved_at is not None:
            issue.resolved_at = payload.resolved_at

        if payload.resolution_notes is not None:
            issue.resolution_notes = VehicleIssueService.normalize_optional_text(
                payload.resolution_notes
            )

        if payload.estimated_cost is not None:
            issue.estimated_cost = payload.estimated_cost

        if payload.final_cost is not None:
            issue.final_cost = payload.final_cost
        VehicleIssueService.validate_status_requirements(issue)
        VehicleIssueService.apply_status_side_effects(issue, vehicle)

        await db.commit()
        await db.refresh(issue)
        await VehicleIssueService.hydrate_issue(db, issue)

        return issue

    @staticmethod
    async def list_issues_by_reporter(
        db: AsyncSession,
        reporter_user_id: int,
    ) -> VehicleIssueListResponseSchema:
        issues = (
            await db.execute(
                select(VehicleIssue)
                .where(VehicleIssue.reported_by_user_id == reporter_user_id)
                .order_by(desc(VehicleIssue.created_at), desc(VehicleIssue.id))
            )
        ).scalars().all()

        for issue in issues:
            await VehicleIssueService.hydrate_issue(db, issue)

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
                .where(VehicleIssue.assigned_mechanic_id == mechanic_user_id)
                .order_by(desc(VehicleIssue.created_at), desc(VehicleIssue.id))
            )
        ).scalars().all()

        for issue in issues:
            await VehicleIssueService.hydrate_issue(db, issue)

        return VehicleIssueListResponseSchema(
            issues=[VehicleIssueService.serialize_issue(issue) for issue in issues]
        )

    @staticmethod
    async def list_all_issues(
        db: AsyncSession,
    ) -> VehicleIssueListResponseSchema:
        issues = (
            await db.execute(
                select(VehicleIssue).order_by(
                    desc(VehicleIssue.created_at),
                    desc(VehicleIssue.id),
                )
            )
        ).scalars().all()

        for issue in issues:
            await VehicleIssueService.hydrate_issue(db, issue)

        return VehicleIssueListResponseSchema(
            issues=[VehicleIssueService.serialize_issue(issue) for issue in issues]
        )
    
    @staticmethod
    def _allowed_status_transitions() -> dict[VehicleIssueStatus, set[VehicleIssueStatus]]:
        return {
            VehicleIssueStatus.OPEN: {
                VehicleIssueStatus.SCHEDULED,
                VehicleIssueStatus.IN_PROGRESS,
                VehicleIssueStatus.CANCELED,
            },
            VehicleIssueStatus.SCHEDULED: {
                VehicleIssueStatus.IN_PROGRESS,
                VehicleIssueStatus.CANCELED,
            },
            VehicleIssueStatus.IN_PROGRESS: {
                VehicleIssueStatus.RESOLVED,
                VehicleIssueStatus.CANCELED,
            },
            VehicleIssueStatus.RESOLVED: set(),
            VehicleIssueStatus.CANCELED: set(),
        }

    @staticmethod
    def validate_status_transition(
        current_status: VehicleIssueStatus,
        new_status: VehicleIssueStatus,
    ) -> None:
        if current_status == new_status:
            return

        allowed = VehicleIssueService._allowed_status_transitions().get(
            current_status,
            set(),
        )

        if new_status not in allowed:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=(
                    f"Invalid issue status transition: "
                    f"{current_status.value} -> {new_status.value}."
                ),
            )
        
    @staticmethod
    def validate_status_requirements(issue: VehicleIssue) -> None:
        if issue.status == VehicleIssueStatus.SCHEDULED:
            if issue.scheduled_for is None:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Scheduled issues must have a scheduled date.",
                )
            if not VehicleIssueService.normalize_optional_text(issue.scheduled_location):
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Scheduled issues must have a scheduled location.",
                )

        if issue.status == VehicleIssueStatus.RESOLVED:
            if not VehicleIssueService.normalize_optional_text(issue.resolution_notes):
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Resolved issues must have resolution notes.",
                )