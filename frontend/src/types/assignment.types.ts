export const ASSIGNMENT_STATUS = {
  PENDING: "pending",
  ACTIVE: "active",
  REJECTED: "rejected",
  CLOSED: "closed",
} as const;

export type AssignmentStatus =
  (typeof ASSIGNMENT_STATUS)[keyof typeof ASSIGNMENT_STATUS];

export interface AssignmentItem {
  id: number;
  user_id: number;
  user_name: string;
  vehicle_id: number;
  vehicle_license_plate: string;
  vehicle_brand: string;
  vehicle_model: string;
  shift_number: number;
  status: AssignmentStatus;
  started_at: string;
  ended_at: string | null;
}

export interface AssignmentListResponse {
  assignments: AssignmentItem[];
}

export interface CreateAssignmentPayload {
  user_id: number;
  vehicle_id: number;
  shift_number: number;
}

export interface CloseAssignmentResponse {
  id: number;
  status: AssignmentStatus;
  ended_at: string | null;
}