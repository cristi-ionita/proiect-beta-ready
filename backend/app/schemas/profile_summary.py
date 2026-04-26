from __future__ import annotations

from datetime import date

from pydantic import  Field

from app.schemas.user import UserRole


from app.schemas.base import BaseSchema


class ProfileUserInfoSchema(BaseSchema):
    user_id: int = Field(validation_alias="id")
    full_name: str
    unique_code: str | None = None
    shift_number: str | None = None
    role: UserRole
    is_active: bool


class ProfileEmployeeInfoSchema(BaseSchema):
    first_name: str
    last_name: str
    phone: str | None = None
    address: str | None = None
    position: str | None = None
    department: str | None = None
    hire_date: date | None = None
    iban: str | None = None
    emergency_contact_name: str | None = None
    emergency_contact_phone: str | None = None


class ProfileDocumentsSummarySchema(BaseSchema):
    total_documents: int
    personal_documents: int
    company_documents: int
    has_contract: bool
    has_payslip: bool
    has_driver_license: bool


class ProfileSummaryResponseSchema(BaseSchema):
    user: ProfileUserInfoSchema
    employee_profile: ProfileEmployeeInfoSchema | None = None
    documents_summary: ProfileDocumentsSummarySchema