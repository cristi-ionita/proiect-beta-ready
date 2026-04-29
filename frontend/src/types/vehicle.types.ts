import type { AssignmentStatus } from "./assignment.types";

export const VEHICLE_STATUS = {
  AVAILABLE: "available",
  ASSIGNED: "assigned",
  IN_SERVICE: "in_service",
  OUT_OF_SERVICE: "out_of_service",
} as const;

export type VehicleStatus =
  (typeof VEHICLE_STATUS)[keyof typeof VEHICLE_STATUS];

export const VEHICLE_AVAILABILITY = {
  OCCUPIED: "occupied",
  FREE: "free",
} as const;

export type VehicleAvailability =
  (typeof VEHICLE_AVAILABILITY)[keyof typeof VEHICLE_AVAILABILITY];

export interface VehicleItem {
  id: number;
  brand: string;
  model: string;
  license_plate: string;
  status: VehicleStatus;
  current_mileage: number;
  created_at: string;
  updated_at: string;
  assigned_to_shift_number?: string | number | null;
}

export interface CreateVehiclePayload {
  brand: string;
  model: string;
  license_plate: string;
  status?: VehicleStatus;
  current_mileage?: number;
}

export type UpdateVehiclePayload = Partial<{
  brand: string;
  model: string;
  license_plate: string;
  status: VehicleStatus;
  current_mileage: number;
}>;

export interface VehicleLiveStatusItem {
  vehicle_id: number;
  brand: string;
  model: string;
  license_plate: string;
  vehicle_status: VehicleStatus;
  availability: VehicleAvailability;
  assigned_to_user_id: number | null;
  assigned_to_name: string | null;
  assigned_to_shift_number: string | number | null;
  active_assignment_id: number | null;
}

export interface VehicleLiveStatusResponse {
  vehicles: VehicleLiveStatusItem[];
}

export type VehicleIssueStatus =
  | "open"
  | "scheduled"
  | "in_progress"
  | "resolved";

export interface MyVehicleUser {
  id: number;
  full_name: string;
  unique_code: string;
  shift_number: string | null;
  is_active: boolean;
}

export interface MyVehicleVehicle {
  id: number;
  brand: string;
  model: string;
  license_plate: string;
  status: VehicleStatus;
  current_mileage: number;
  created_at?: string;
  updated_at?: string;
}

export interface MyVehicleAssignment {
  id: number;
  status: AssignmentStatus;
  started_at: string;
  ended_at: string | null;
}

export interface MyVehicleHandoverStart {
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

export interface MyVehicleHandoverEnd {
  mileage_end: number | null;
  dashboard_warnings_end: string | null;
  damage_notes_end: string | null;
  notes_end: string | null;
  is_completed: boolean;
}

export interface VehicleIssue {
  id: number;
  status: VehicleIssueStatus;
  need_service_in_km: number | null;
  need_brakes: boolean;
  need_tires: boolean;
  need_oil: boolean;
  dashboard_checks: string | null;
  other_problems: string | null;
  created_at: string;
  updated_at: string;
}

export type MyVehicleIssue = VehicleIssue;

export type VehiclePhotoType =
  | "exterior"
  | "interior"
  | "damage"
  | "registration";

export interface MyVehiclePhoto {
  id: number;
  type: VehiclePhotoType;
  file_name: string;
  mime_type: string;
  file_size: number;
  created_at: string;
}

export interface MyVehicleResponse {
  user: MyVehicleUser;
  vehicle: MyVehicleVehicle | null;
  assignment: MyVehicleAssignment | null;
  handover_start: MyVehicleHandoverStart | null;
  handover_end: MyVehicleHandoverEnd | null;
  open_issues: MyVehicleIssue[];
  photos: MyVehiclePhoto[];
}