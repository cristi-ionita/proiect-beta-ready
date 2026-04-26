export const LEAVE_STATUS = {
  PENDING: "pending",
  APPROVED: "approved",
  REJECTED: "rejected",
} as const;

export type LeaveStatus =
  (typeof LEAVE_STATUS)[keyof typeof LEAVE_STATUS];

export interface LeaveRequest {
  id: string;
  user_id: string;

  start_date: string;
  end_date: string;
  reason: string | null;

  status: LeaveStatus;

  created_at: string;
  updated_at: string;
}