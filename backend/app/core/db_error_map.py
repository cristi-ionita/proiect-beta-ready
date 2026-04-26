from __future__ import annotations

from fastapi import status
from sqlalchemy.exc import IntegrityError

CONSTRAINT_TO_ERROR_CODE: dict[str, str] = {
    # users
    "ck_users_full_name_not_blank": "users.full_name.blank",
    "ck_users_role_valid": "users.role.invalid",
    "ck_users_status_valid": "users.status.invalid",
    "ck_users_email_not_blank_when_present": "users.email.blank",
    "ck_users_unique_code_not_blank_when_present": "users.unique_code.blank",
    "ck_users_username_not_blank_when_present": "users.username.blank",
    "ck_users_shift_number_not_blank_when_present": "users.shift_number.blank",
    "ck_users_password_hash_not_blank": "users.password_hash.blank",
    "ck_users_rejection_reason_not_blank_when_present": "users.rejection_reason.blank",

    # employee_profiles
    "ck_employee_profiles_first_name_not_blank": "employee_profiles.first_name.blank",
    "ck_employee_profiles_last_name_not_blank": "employee_profiles.last_name.blank",
    "ck_employee_profiles_phone_not_blank_when_present": "employee_profiles.phone.blank",
    "ck_employee_profiles_address_not_blank_when_present": "employee_profiles.address.blank",
    "ck_employee_profiles_position_not_blank_when_present": "employee_profiles.position.blank",
    "ck_employee_profiles_department_not_blank_when_present": "employee_profiles.department.blank",
    "ck_employee_profiles_iban_not_blank_when_present": "employee_profiles.iban.blank",
    "ck_emp_profiles_emerg_contact_name_not_blank": "employee_profiles.emergency_contact_name.blank",
    "ck_emp_profiles_emerg_contact_phone_not_blank": "employee_profiles.emergency_contact_phone.blank",

    # documents
    "ck_documents_file_name_not_blank": "documents.file_name.blank",
    "ck_documents_file_path_not_blank": "documents.file_path.blank",
    "ck_documents_mime_type_not_blank": "documents.mime_type.blank",
    "ck_documents_title_not_blank_when_present": "documents.title.blank",
    "ck_documents_file_size_non_negative": "documents.file_size.invalid",

    # vehicles
    "ck_vehicles_brand_not_blank": "vehicles.brand.blank",
    "ck_vehicles_model_not_blank": "vehicles.model.blank",
    "ck_vehicles_license_plate_not_blank": "vehicles.license_plate.blank",
    "ck_vehicles_year_min_1900": "vehicles.year.invalid",
    "ck_vehicles_year_max_2100": "vehicles.year.invalid",
    "ck_vehicles_current_mileage_non_negative": "vehicles.current_mileage.invalid",
    "ck_vehicles_vin_not_blank_if_present": "vehicles.vin.blank",

    # vehicle assignments
    "ck_vehicle_assignments_ended_at_after_started_at": "vehicle_assignments.date_range.invalid",
    "ck_vehicle_assignments_status_matches_ended_at": "vehicle_assignments.status.invalid",
    "ck_vehicle_assignments_notes_not_blank_when_present": "vehicle_assignments.notes.blank",
    "ux_vehicle_assignments_active_vehicle": "vehicle_assignments.active_vehicle.conflict",
    "ux_vehicle_assignments_active_user": "vehicle_assignments.active_user.conflict",

    # vehicle issues
    "ck_vehicle_issues_need_service_in_km_non_negative": "vehicle_issues.need_service_in_km.invalid",
    "ck_vehicle_issues_estimated_cost_non_negative": "vehicle_issues.estimated_cost.invalid",
    "ck_vehicle_issues_final_cost_non_negative": "vehicle_issues.final_cost.invalid",
    "ck_vehicle_issues_scheduled_location_not_blank_if_present": "vehicle_issues.scheduled_location.blank",
    "ck_vehicle_issues_dashboard_checks_not_blank_if_present": "vehicle_issues.dashboard_checks.blank",
    "ck_vehicle_issues_other_problems_not_blank_if_present": "vehicle_issues.other_problems.blank",
    "ck_vehicle_issues_resolution_notes_not_blank_if_present": "vehicle_issues.resolution_notes.blank",
    "ck_vehicle_issues_scheduled_requires_datetime": "vehicle_issues.scheduled_requires_datetime",
    "ck_vehicle_issues_scheduled_location_requires_datetime": "vehicle_issues.scheduled_location_requires_datetime",
    "ck_vehicle_issues_resolved_at_after_started_at": "vehicle_issues.resolved_at.invalid",

    # handover reports
    "ck_vehicle_handover_reports_mileage_start_non_negative": "vehicle_handover_reports.mileage_start.invalid",
    "ck_vehicle_handover_reports_mileage_end_non_negative": "vehicle_handover_reports.mileage_end.invalid",
    "ck_vehicle_handover_reports_mileage_end_after_start": "vehicle_handover_reports.mileage_range.invalid",
    "ck_vehicle_handover_reports_dashboard_warnings_start_not_blank": "vehicle_handover_reports.dashboard_warnings_start.blank",
    "ck_vehicle_handover_reports_dashboard_warnings_end_not_blank": "vehicle_handover_reports.dashboard_warnings_end.blank",
    "ck_vehicle_handover_reports_damage_notes_start_not_blank": "vehicle_handover_reports.damage_notes_start.blank",
    "ck_vehicle_handover_reports_damage_notes_end_not_blank": "vehicle_handover_reports.damage_notes_end.blank",
    "ck_vehicle_handover_reports_notes_start_not_blank": "vehicle_handover_reports.notes_start.blank",
    "ck_vehicle_handover_reports_notes_end_not_blank": "vehicle_handover_reports.notes_end.blank",

    # leave requests
    "ck_leave_requests_end_date_after_start_date": "leave_requests.date_range.invalid",
    "ck_leave_requests_reason_not_blank_if_present": "leave_requests.reason.blank",
    "ck_leave_requests_rejection_reason_not_blank_if_present": "leave_requests.rejection_reason.blank",
    "ck_leave_requests_review_fields_match_status": "leave_requests.review_fields.invalid",
}


def extract_integrity_error_message(exc: IntegrityError) -> str:
    original = getattr(exc, "orig", None)
    if original is None:
        return str(exc)

    detail = getattr(original, "detail", None)
    if detail:
        return str(detail)

    return str(original)


def extract_constraint_name(exc: IntegrityError) -> str | None:
    original = getattr(exc, "orig", None)
    if original is None:
        return None

    constraint_name = getattr(original, "constraint_name", None)
    if constraint_name:
        return str(constraint_name)

    text = str(original)

    for name in CONSTRAINT_TO_ERROR_CODE:
        if name in text:
            return name

    return None


def map_integrity_error(exc: IntegrityError) -> tuple[str, str, int]:
    message = extract_integrity_error_message(exc)
    constraint_name = extract_constraint_name(exc)
    text = f"{message} {constraint_name or ''}".lower()

    if constraint_name and constraint_name in CONSTRAINT_TO_ERROR_CODE:
        code = CONSTRAINT_TO_ERROR_CODE[constraint_name]

        if constraint_name.startswith("ux_"):
            return ("CONFLICT", code, status.HTTP_409_CONFLICT)

        return ("BAD_REQUEST", code, status.HTTP_400_BAD_REQUEST)

    if "duplicate key" in text or "unique constraint" in text or "unique violation" in text:
        return ("CONFLICT", "errors.db.unique_violation", status.HTTP_409_CONFLICT)

    if "foreign key" in text or "violates foreign key constraint" in text:
        return ("BAD_REQUEST", "errors.db.foreign_key_violation", status.HTTP_400_BAD_REQUEST)

    if "not-null constraint" in text or "null value in column" in text:
        return ("BAD_REQUEST", "errors.db.not_null_violation", status.HTTP_400_BAD_REQUEST)

    return ("BAD_REQUEST", "errors.db.constraint_violation", status.HTTP_400_BAD_REQUEST)