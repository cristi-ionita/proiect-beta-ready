export const VEHICLE_ISSUE_STATUS = {
  OPEN: "open",
  SCHEDULED: "scheduled",
  IN_PROGRESS: "in_progress",
  RESOLVED: "resolved",
  CANCELED: "canceled",
} as const;

export type VehicleIssueStatus =
  (typeof VEHICLE_ISSUE_STATUS)[keyof typeof VEHICLE_ISSUE_STATUS];

export const VEHICLE_ISSUE_PRIORITY = {
  LOW: "low",
  MEDIUM: "medium",
  HIGH: "high",
  CRITICAL: "critical",
} as const;

export type VehicleIssuePriority =
  (typeof VEHICLE_ISSUE_PRIORITY)[keyof typeof VEHICLE_ISSUE_PRIORITY];

export interface IssueItem {
  id: number;
  vehicle_id: number;
  assignment_id: number | null;
  reported_by_user_id: number;
  assigned_mechanic_id?: number | null;

  priority?: VehicleIssuePriority;

  need_service_in_km: number | null;
  need_brakes: boolean;
  need_tires: boolean;
  need_oil: boolean;
  dashboard_checks: string | null;
  other_problems: string | null;

  status: VehicleIssueStatus;
  scheduled_for?: string | null;
  scheduled_location?: string | null;
  started_at?: string | null;
  resolved_at?: string | null;
  resolution_notes?: string | null;
  estimated_cost?: number | null;
  final_cost?: number | null;

  created_at: string;
  updated_at: string;

  vehicle_license_plate?: string;
  vehicle_brand?: string;
  vehicle_model?: string;
  reported_by_name?: string;
}

export interface IssuesResponse {
  issues: IssueItem[];
}

export interface UpdateIssuePayload {
  status?: VehicleIssueStatus;
  assigned_mechanic_id?: number | null;
  scheduled_for?: string | null;
  scheduled_location?: string | null;
  priority?: VehicleIssuePriority;
}

export interface CreateIssuePayload {
  priority?: VehicleIssuePriority;
  need_service_in_km?: number | null;
  need_brakes: boolean;
  need_tires: boolean;
  need_oil: boolean;
  dashboard_checks?: string | null;
  other_problems?: string | null;
}