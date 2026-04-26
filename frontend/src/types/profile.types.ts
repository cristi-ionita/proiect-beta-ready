import type { UserRole } from "./user.types";

export interface ProfileSummaryUser {
  id: number;
  full_name: string;
  email?: string | null;
  unique_code: string;
  username?: string | null;
  shift_number: string | null;
  is_active: boolean;
  role?: UserRole;
}

export interface ProfileSummaryEmployeeProfile {
  first_name: string;
  last_name: string;
  phone: string | null;
  address: string | null;
  position: string | null;
  department: string | null;
  hire_date: string | null;
  iban: string | null;
  emergency_contact_name: string | null;
  emergency_contact_phone: string | null;
  created_at: string;
  updated_at: string;
}

export interface ProfileSummaryDocuments {
  total_documents: number;
  personal_documents: number;
  company_documents: number;
  has_contract: boolean;
  has_payslip: boolean;
  has_driver_license: boolean;
}

export interface ProfileSummaryResponse {
  user: ProfileSummaryUser;
  employee_profile: ProfileSummaryEmployeeProfile | null;
  documents_summary: ProfileSummaryDocuments;
}

export interface UpdateMyProfilePayload {
  username?: string | null;
  pin?: string | null;
  first_name?: string | null;
  last_name?: string | null;
  phone?: string | null;
  address?: string | null;
  position?: string | null;
  department?: string | null;
  hire_date?: string | null;
  iban?: string | null;
  emergency_contact_name?: string | null;
  emergency_contact_phone?: string | null;
}

export interface UpdateMyAccountPayload {
  email?: string | null;
  username?: string | null;
  current_password?: string;
  password?: string;
}