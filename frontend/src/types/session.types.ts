export type AssignmentStatus = "active" | "closed";
export type VehicleStatus = "active" | "in_service" | "inactive" | "sold";

export interface SessionPageSession {
  assignment_id: number;
  status: AssignmentStatus;
  started_at: string;
}

export interface SessionPageUser {
  id: number;
  full_name: string;
  unique_code: string;
}

export interface SessionPageVehicle {
  id: number;
  brand: string;
  model: string;
  license_plate: string;
  year: number;
  status: VehicleStatus;
  current_mileage: number;
}

export interface PreviousHandoverReport {
  assignment_id: number;
  previous_driver_name: string;
  previous_session_started_at: string;
  previous_session_ended_at: string | null;
}

export interface SessionHandoverStart {
  mileage_start: number | null;
  dashboard_warnings_start: string | null;
  damage_notes_start: string | null;
  notes_start: string | null;
  has_documents: boolean;
  has_medkit: boolean;
  has_extinguisher: boolean;
  has_warning_triangle: boolean;
  has_spare_wheel: boolean;
  is_completed: boolean;
}

export interface SessionHandoverEnd {
  mileage_end: number | null;
  dashboard_warnings_end: string | null;
  damage_notes_end: string | null;
  notes_end: string | null;
  is_completed: boolean;
}

export interface SessionPageResponse {
  session: SessionPageSession;
  user: SessionPageUser;
  vehicle: SessionPageVehicle;
  previous_handover_report: PreviousHandoverReport | null;
  handover_start: SessionHandoverStart | null;
  handover_end: SessionHandoverEnd | null;
}

export interface HandoverStartPayload {
  mileage_start: number;
  dashboard_warnings_start: string;
  damage_notes_start: string;
  notes_start: string;
  has_documents: boolean;
  has_medkit: boolean;
  has_extinguisher: boolean;
  has_warning_triangle: boolean;
  has_spare_wheel: boolean;
}

export interface HandoverStartResponse {
  assignment_id: number;
  mileage_start: number;
  dashboard_warnings_start: string;
  damage_notes_start: string;
  notes_start: string;
  has_documents: boolean;
  has_medkit: boolean;
  has_extinguisher: boolean;
  has_warning_triangle: boolean;
  has_spare_wheel: boolean;
}

export interface HandoverEndPayload {
  mileage_end: number;
  dashboard_warnings_end: string;
  damage_notes_end: string;
  notes_end: string;
}

export interface HandoverEndResponse {
  assignment_id: number;
  mileage_end: number;
  dashboard_warnings_end: string;
  damage_notes_end: string;
  notes_end: string;
}