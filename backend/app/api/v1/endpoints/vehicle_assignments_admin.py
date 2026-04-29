from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, Path, Query, Response, status
from sqlalchemy import desc, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.v1.dependencies import require_admin
from app.db.models.user import User
from app.db.models.vehicle import Vehicle
from app.db.models.vehicle_assignment import AssignmentStatus, VehicleAssignment
from app.db.session import get_db
from app.schemas.vehicle_assignment_admin import (
    VehicleAssignmentCloseResponseSchema,
    VehicleAssignmentCreateRequestSchema,
    VehicleAssignmentListResponseSchema,
    VehicleAssignmentReadSchema,
)
from app.services.vehicle_assignment_service import VehicleAssignmentService

router = APIRouter(
    prefix="/admin-assignments",
    tags=["admin-assignments"],
)


def _parse_assignment_status(value: str) -> AssignmentStatus:
    try:
        return AssignmentStatus(value.strip().lower())
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid assignment status.",
        ) from exc


@router.post(
    "",
    response_model=VehicleAssignmentReadSchema,
    status_code=status.HTTP_201_CREATED,
)
async def create_assignment(
    payload: VehicleAssignmentCreateRequestSchema,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(require_admin),
) -> VehicleAssignmentReadSchema:
    user = await VehicleAssignmentService.get_user_or_404(db, payload.user_id)
    vehicle = await VehicleAssignmentService.get_vehicle_or_404(db, payload.vehicle_id)

    assignment = await VehicleAssignmentService.create_assignment(
        db=db,
        user=user,
        vehicle=vehicle,
        shift_number=payload.shift_number,
    )

    return VehicleAssignmentService.build_assignment_read(
        assignment=assignment,
        user=user,
        vehicle=vehicle,
    )


@router.get("/rejected", response_model=list[VehicleAssignmentReadSchema])
async def list_rejected_assignments(
    db: AsyncSession = Depends(get_db),
    _: User = Depends(require_admin),
) -> list[VehicleAssignmentReadSchema]:
    rows = (
        await db.execute(
            select(VehicleAssignment, User, Vehicle)
            .join(User, User.id == VehicleAssignment.user_id)
            .join(Vehicle, Vehicle.id == VehicleAssignment.vehicle_id)
            .where(VehicleAssignment.status == AssignmentStatus.REJECTED)
            .order_by(
                desc(VehicleAssignment.ended_at),
                desc(VehicleAssignment.id),
            )
        )
    ).all()

    return [
        VehicleAssignmentService.build_assignment_read(
            assignment=assignment,
            user=user,
            vehicle=vehicle,
        )
        for assignment, user, vehicle in rows
    ]


@router.get("", response_model=VehicleAssignmentListResponseSchema)
async def list_assignments(
    status_filter: str | None = Query(default=None, alias="status"),
    user_id: int | None = Query(default=None, gt=0),
    vehicle_id: int | None = Query(default=None, gt=0),
    db: AsyncSession = Depends(get_db),
    _: User = Depends(require_admin),
) -> VehicleAssignmentListResponseSchema:
    query = (
        select(VehicleAssignment, User, Vehicle)
        .join(User, User.id == VehicleAssignment.user_id)
        .join(Vehicle, Vehicle.id == VehicleAssignment.vehicle_id)
    )

    if status_filter:
        query = query.where(
            VehicleAssignment.status == _parse_assignment_status(status_filter)
        )

    if user_id is not None:
        query = query.where(VehicleAssignment.user_id == user_id)

    if vehicle_id is not None:
        query = query.where(VehicleAssignment.vehicle_id == vehicle_id)

    rows = (
        await db.execute(
            query.order_by(
                desc(VehicleAssignment.started_at),
                desc(VehicleAssignment.id),
            )
        )
    ).all()

    return VehicleAssignmentListResponseSchema(
        assignments=[
            VehicleAssignmentService.build_assignment_read(
                assignment=assignment,
                user=user,
                vehicle=vehicle,
            )
            for assignment, user, vehicle in rows
        ]
    )


@router.patch(
    "/{assignment_id}/close",
    response_model=VehicleAssignmentCloseResponseSchema,
)
async def close_assignment(
    assignment_id: int = Path(..., gt=0),
    db: AsyncSession = Depends(get_db),
    _: User = Depends(require_admin),
) -> VehicleAssignmentCloseResponseSchema:
    assignment = await VehicleAssignmentService.get_assignment_or_404(
        db=db,
        assignment_id=assignment_id,
    )

    assignment = await VehicleAssignmentService.close_assignment(
        db=db,
        assignment=assignment,
    )

    if assignment.ended_at is None:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Closed assignment is missing ended_at.",
        )

    return VehicleAssignmentCloseResponseSchema(
        id=assignment.id,
        status=assignment.status,
        ended_at=assignment.ended_at,
    )


@router.delete(
    "/{assignment_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    response_class=Response,
)
async def delete_closed_assignment(
    assignment_id: int = Path(..., gt=0),
    db: AsyncSession = Depends(get_db),
    _: User = Depends(require_admin),
) -> Response:
    assignment = await VehicleAssignmentService.get_assignment_or_404(
        db=db,
        assignment_id=assignment_id,
    )

    await VehicleAssignmentService.delete_assignment(
        db=db,
        assignment=assignment,
    )

    return Response(status_code=status.HTTP_204_NO_CONTENT)