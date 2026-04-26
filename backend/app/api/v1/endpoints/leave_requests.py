from __future__ import annotations

from datetime import UTC, datetime

from fastapi import APIRouter, Depends, HTTPException, Response, status
from sqlalchemy import desc, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.v1.dependencies import require_admin, require_employee
from app.db.models.leave_request import LeaveRequest, LeaveStatus
from app.db.models.user import User
from app.db.session import get_db
from app.schemas.leave_request import (
    LeaveRequestCreateSchema,
    LeaveRequestCreateResponseSchema,
    LeaveRequestItemSchema,
    LeaveRequestListResponseSchema,
    LeaveRequestReviewSchema,
    LeaveRequestReviewResponseSchema,
)

router = APIRouter(prefix="/leave-requests", tags=["leave-requests"])


def _normalize_reason(value: str | None) -> str | None:
    if value is None:
        return None
    cleaned = " ".join(value.strip().split())
    return cleaned or None


async def _get_leave_or_404(db: AsyncSession, leave_id: int) -> LeaveRequest:
    leave = (
        await db.execute(select(LeaveRequest).where(LeaveRequest.id == leave_id))
    ).scalar_one_or_none()

    if leave is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Leave request not found.",
        )

    return leave


@router.post(
    "",
    response_model=LeaveRequestCreateResponseSchema,
    status_code=status.HTTP_201_CREATED,
)
async def create_leave(
    payload: LeaveRequestCreateSchema,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_employee),
) -> LeaveRequestCreateResponseSchema:
    leave = LeaveRequest(
        user_id=current_user.id,
        start_date=payload.start_date,
        end_date=payload.end_date,
        reason=_normalize_reason(payload.reason),
        status=LeaveStatus.PENDING,
    )

    db.add(leave)
    await db.commit()
    await db.refresh(leave)

    return LeaveRequestCreateResponseSchema.model_validate(leave)


@router.get("/me", response_model=LeaveRequestListResponseSchema)
async def my_leaves(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_employee),
) -> LeaveRequestListResponseSchema:
    result = await db.execute(
        select(LeaveRequest)
        .where(LeaveRequest.user_id == current_user.id)
        .order_by(desc(LeaveRequest.created_at), desc(LeaveRequest.id))
    )

    return LeaveRequestListResponseSchema(
        requests=[
            LeaveRequestItemSchema.model_validate(item)
            for item in result.scalars().all()
        ]
    )


@router.get("", response_model=LeaveRequestListResponseSchema)
async def list_all_leaves(
    db: AsyncSession = Depends(get_db),
    _: User = Depends(require_admin),
) -> LeaveRequestListResponseSchema:
    result = await db.execute(
        select(LeaveRequest).order_by(
            desc(LeaveRequest.created_at),
            desc(LeaveRequest.id),
        )
    )

    return LeaveRequestListResponseSchema(
        requests=[
            LeaveRequestItemSchema.model_validate(item)
            for item in result.scalars().all()
        ]
    )


@router.patch("/{leave_id}", response_model=LeaveRequestReviewResponseSchema)
async def review_leave(
    leave_id: int,
    payload: LeaveRequestReviewSchema,
    db: AsyncSession = Depends(get_db),
    admin_user: User = Depends(require_admin),
) -> LeaveRequestReviewResponseSchema:
    leave = await _get_leave_or_404(db, leave_id)

    if leave.status != LeaveStatus.PENDING:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Leave request has already been processed.",
        )

    if payload.status not in {LeaveStatus.APPROVED, LeaveStatus.REJECTED}:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only approved or rejected are allowed for review.",
        )

    leave.status = payload.status
    leave.reviewed_by_admin_id = admin_user.id
    leave.reviewed_at = datetime.now(UTC)
    leave.rejection_reason = (
        payload.rejection_reason if payload.status == LeaveStatus.REJECTED else None
    )

    await db.commit()
    await db.refresh(leave)

    return LeaveRequestReviewResponseSchema.model_validate(leave)


@router.delete("/{leave_id}", status_code=status.HTTP_204_NO_CONTENT)
async def cancel_my_leave(
    leave_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_employee),
) -> Response:
    leave = await _get_leave_or_404(db, leave_id)

    if leave.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied.",
        )

    if leave.status != LeaveStatus.PENDING:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only pending leave requests can be canceled.",
        )

    leave.status = LeaveStatus.CANCELED

    await db.commit()

    return Response(status_code=status.HTTP_204_NO_CONTENT)