from __future__ import annotations

from datetime import date

from fastapi import APIRouter, Depends
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.v1.dependencies import require_admin
from app.db.models.document import Document, DocumentCategory, DocumentType
from app.db.models.leave_request import LeaveRequest, LeaveStatus
from app.db.models.user import User
from app.db.models.vehicle import Vehicle, VehicleStatus
from app.db.models.vehicle_assignment import AssignmentStatus, VehicleAssignment
from app.db.models.vehicle_issue import VehicleIssue, VehicleIssueStatus
from app.db.session import get_db
from app.schemas.user import UserStatus

router = APIRouter(prefix="/admin-dashboard", tags=["admin-dashboard"])


async def _count(
    db: AsyncSession,
    model_field,
    *conditions,
) -> int:
    query = select(func.count(model_field))
    if conditions:
        query = query.where(*conditions)
    return int(await db.scalar(query) or 0)


@router.get("/summary")
async def dashboard_summary(
    db: AsyncSession = Depends(get_db),
    _: User = Depends(require_admin),
):
    today = date.today()

    users_total = await _count(db, User.id)
    users_active = await _count(db,User.id,User.is_active.is_(True),User.role == "employee",)
    users_inactive = await _count(db, User.id, User.is_active.is_(False))
    users_pending = await _count(db, User.id, User.status == UserStatus.PENDING.value)
    users_approved = await _count(db, User.id, User.status == UserStatus.APPROVED.value)
    users_rejected = await _count(db, User.id, User.status == UserStatus.REJECTED.value)
    users_suspended = await _count(db, User.id, User.status == UserStatus.SUSPENDED.value)

    users_on_leave_today = await _count(
        db,
        LeaveRequest.user_id,
        LeaveRequest.status == LeaveStatus.APPROVED,
        LeaveRequest.start_date <= today,
        LeaveRequest.end_date >= today,
    )

    users_working_today = max(users_active - users_on_leave_today, 0)

    vehicles_total = await _count(db, Vehicle.id)
    vehicles_available = await _count(
        db,
        Vehicle.id,
        Vehicle.status == VehicleStatus.AVAILABLE,
    )
    vehicles_assigned = await _count(
        db,
        Vehicle.id,
        Vehicle.status == VehicleStatus.ASSIGNED,
    )
    vehicles_in_service = await _count(
        db,
        Vehicle.id,
        Vehicle.status == VehicleStatus.IN_SERVICE,
    )
    vehicles_out_of_service = await _count(
        db,
        Vehicle.id,
        Vehicle.status == VehicleStatus.OUT_OF_SERVICE,
    )

    assignments_active = await _count(
        db,
        VehicleAssignment.id,
        VehicleAssignment.status == AssignmentStatus.ACTIVE,
    )
    assignments_closed = await _count(
        db,
        VehicleAssignment.id,
        VehicleAssignment.status == AssignmentStatus.CLOSED,
    )

    issues_total = await _count(db, VehicleIssue.id)
    issues_open = await _count(
        db,
        VehicleIssue.id,
        VehicleIssue.status == VehicleIssueStatus.OPEN,
    )
    issues_scheduled = await _count(
        db,
        VehicleIssue.id,
        VehicleIssue.status == VehicleIssueStatus.SCHEDULED,
    )
    issues_in_progress = await _count(
        db,
        VehicleIssue.id,
        VehicleIssue.status == VehicleIssueStatus.IN_PROGRESS,
    )
    issues_resolved = await _count(
        db,
        VehicleIssue.id,
        VehicleIssue.status == VehicleIssueStatus.RESOLVED,
    )
    issues_canceled = await _count(
        db,
        VehicleIssue.id,
        VehicleIssue.status == VehicleIssueStatus.CANCELED,
    )

    documents_total = await _count(db, Document.id)
    documents_personal = await _count(
        db,
        Document.id,
        Document.category == DocumentCategory.PERSONAL,
    )
    documents_company = await _count(
        db,
        Document.id,
        Document.category == DocumentCategory.COMPANY,
    )
    documents_contracts = await _count(
        db,
        Document.id,
        Document.type == DocumentType.CONTRACT,
    )
    documents_payslips = await _count(
        db,
        Document.id,
        Document.type == DocumentType.PAYSLIP,
    )
    documents_driver_licenses = await _count(
        db,
        Document.id,
        Document.type == DocumentType.DRIVER_LICENSE,
    )

    recent_issues_rows = (
        await db.execute(
            select(
                VehicleIssue.id,
                VehicleIssue.status,
                VehicleIssue.priority,
                VehicleIssue.created_at,
                VehicleIssue.other_problems,
                Vehicle.license_plate,
                User.full_name,
            )
            .join(Vehicle, Vehicle.id == VehicleIssue.vehicle_id)
            .join(User, User.id == VehicleIssue.reported_by_user_id)
            .order_by(VehicleIssue.created_at.desc(), VehicleIssue.id.desc())
            .limit(5)
        )
    ).all()

    active_assignments_rows = (
        await db.execute(
            select(
                VehicleAssignment.id,
                VehicleAssignment.started_at,
                Vehicle.license_plate,
                Vehicle.brand,
                Vehicle.model,
                User.full_name,
            )
            .join(User, User.id == VehicleAssignment.user_id)
            .join(Vehicle, Vehicle.id == VehicleAssignment.vehicle_id)
            .where(VehicleAssignment.status == AssignmentStatus.ACTIVE)
            .order_by(VehicleAssignment.started_at.desc(), VehicleAssignment.id.desc())
            .limit(10)
        )
    ).all()

    return {
        "users": {
            "total": users_total,
            "active": users_active,
            "working_today": users_working_today,
            "on_leave_today": users_on_leave_today,
            "inactive": users_inactive,
            "pending": users_pending,
            "approved": users_approved,
            "rejected": users_rejected,
            "suspended": users_suspended,
        },
        "vehicles": {
            "total": vehicles_total,
            "available": vehicles_available,
            "assigned": vehicles_assigned,
            "in_service": vehicles_in_service,
            "out_of_service": vehicles_out_of_service,
        },
        "assignments": {
            "active": assignments_active,
            "closed": assignments_closed,
        },
        "issues": {
            "total": issues_total,
            "open": issues_open,
            "scheduled": issues_scheduled,
            "in_progress": issues_in_progress,
            "resolved": issues_resolved,
            "canceled": issues_canceled,
        },
        "documents": {
            "total": documents_total,
            "personal": documents_personal,
            "company": documents_company,
            "contracts": documents_contracts,
            "payslips": documents_payslips,
            "driver_licenses": documents_driver_licenses,
        },
        "recent_issues": [
            {
                "id": row.id,
                "status": row.status.value,
                "priority": row.priority.value,
                "created_at": row.created_at,
                "vehicle_license_plate": row.license_plate,
                "reported_by": row.full_name,
                "problem": row.other_problems,
            }
            for row in recent_issues_rows
        ],
        "active_assignments": [
            {
                "id": row.id,
                "started_at": row.started_at,
                "vehicle_license_plate": row.license_plate,
                "vehicle_display_name": f"{row.brand} {row.model} ({row.license_plate})",
                "user_full_name": row.full_name,
            }
            for row in active_assignments_rows
        ],
    }