from __future__ import annotations

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.v1.dependencies import require_admin, require_employee, require_mechanic
from app.db.models.user import User
from app.db.session import get_db
from app.schemas.vehicle_issue import (
    VehicleIssueCreateRequestSchema,
    VehicleIssueListResponseSchema,
    VehicleIssueReadSchema,
    VehicleIssueUpdateRequestSchema,
)
from app.services.vehicle_issue_service import VehicleIssueService

router = APIRouter(prefix="/vehicle-issues", tags=["vehicle-issues"])


@router.post(
    "",
    response_model=VehicleIssueReadSchema,
    status_code=201,
)
async def create_issue(
    payload: VehicleIssueCreateRequestSchema,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_employee),
) -> VehicleIssueReadSchema:
    issue = await VehicleIssueService.create_issue(
        db=db,
        current_user=current_user,
        payload=payload,
    )
    return VehicleIssueService.serialize_issue(issue)


@router.get("/me", response_model=VehicleIssueListResponseSchema)
async def my_issues(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_employee),
) -> VehicleIssueListResponseSchema:
    return await VehicleIssueService.list_issues_by_reporter(db, current_user.id)


@router.get("/mechanic", response_model=VehicleIssueListResponseSchema)
async def list_mechanic_issues(
    db: AsyncSession = Depends(get_db),
    mechanic: User = Depends(require_mechanic),
) -> VehicleIssueListResponseSchema:
    return await VehicleIssueService.list_issues_by_mechanic(db, mechanic.id)


@router.get("", response_model=VehicleIssueListResponseSchema)
async def list_issues(
    db: AsyncSession = Depends(get_db),
    _: User = Depends(require_admin),
) -> VehicleIssueListResponseSchema:
    return await VehicleIssueService.list_all_issues(db)


@router.patch("/{issue_id}/status", response_model=VehicleIssueReadSchema)
async def update_status(
    issue_id: int,
    payload: VehicleIssueUpdateRequestSchema,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(require_admin),
) -> VehicleIssueReadSchema:
    issue = await VehicleIssueService.get_issue_or_404(db, issue_id)
    issue = await VehicleIssueService.update_issue_by_admin(
        db=db,
        issue=issue,
        payload=payload,
    )
    return VehicleIssueService.serialize_issue(issue)


@router.patch("/{issue_id}/mechanic", response_model=VehicleIssueReadSchema)
async def mechanic_update(
    issue_id: int,
    payload: VehicleIssueUpdateRequestSchema,
    db: AsyncSession = Depends(get_db),
    mechanic: User = Depends(require_mechanic),
) -> VehicleIssueReadSchema:
    issue = await VehicleIssueService.get_issue_or_404(db, issue_id)
    issue = await VehicleIssueService.update_issue_by_mechanic(
        db=db,
        issue=issue,
        mechanic=mechanic,
        payload=payload,
    )
    return VehicleIssueService.serialize_issue(issue)