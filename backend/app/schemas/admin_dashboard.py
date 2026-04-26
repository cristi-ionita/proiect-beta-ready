from __future__ import annotations

from datetime import datetime

from app.schemas.base import BaseSchema


class DashboardUsersSummarySchema(BaseSchema):
    total: int
    active: int
    inactive: int


class DashboardVehiclesSummarySchema(BaseSchema):
    total: int
    active: int
    in_service: int
    inactive: int
    sold: int


class DashboardAssignmentsSummarySchema(BaseSchema):
    active: int
    closed: int


class DashboardIssuesSummarySchema(BaseSchema):
    total: int
    open: int
    scheduled: int
    in_progress: int
    resolved: int


class DashboardDocumentsSummarySchema(BaseSchema):
    total: int
    personal: int
    company: int
    contracts: int
    payslips: int
    driver_licenses: int


class DashboardRecentIssueSchema(BaseSchema):
    id: int
    status: str
    created_at: datetime
    vehicle_license_plate: str
    reported_by: str
    problem: str | None = None


class DashboardActiveAssignmentSchema(BaseSchema):
    id: int
    started_at: datetime
    vehicle_license_plate: str
    vehicle_display_name: str
    user_full_name: str


class AdminDashboardSummaryResponseSchema(BaseSchema):
    users: DashboardUsersSummarySchema
    vehicles: DashboardVehiclesSummarySchema
    assignments: DashboardAssignmentsSummarySchema
    issues: DashboardIssuesSummarySchema
    documents: DashboardDocumentsSummarySchema
    recent_issues: list[DashboardRecentIssueSchema]
    active_assignments: list[DashboardActiveAssignmentSchema]