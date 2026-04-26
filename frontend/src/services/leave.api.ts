import { api } from "@/lib/axios";

export type LeaveStatus =
  | "pending"
  | "approved"
  | "rejected"
  | "canceled";

export type LeaveRequestCreatePayload = {
  start_date: string;
  end_date: string;
  reason?: string | null;
};

export type LeaveRequestCreateResponse = {
  id: number;
  user_id: number;
  start_date: string;
  end_date: string;
  reason?: string | null;
  status: LeaveStatus;
  created_at: string;
};

export type LeaveRequestItem = {
  id: number;
  user_id: number;
  start_date: string;
  end_date: string;
  reason?: string | null;
  status: LeaveStatus;
  reviewed_by_admin_id?: number | null;
  reviewed_at?: string | null;
  rejection_reason?: string | null;
  created_at: string;
};

export type LeaveRequestListResponse = {
  requests: LeaveRequestItem[];
};

export type LeaveReviewPayload = {
  status: "approved" | "rejected";
  rejection_reason?: string | null;
};

export type LeaveReviewResponse = {
  id: number;
  status: LeaveStatus;
  reviewed_by_admin_id?: number | null;
  reviewed_at?: string | null;
  rejection_reason?: string | null;
};

export async function createLeaveRequest(
  payload: LeaveRequestCreatePayload
): Promise<LeaveRequestCreateResponse> {
  const { data } = await api.post<LeaveRequestCreateResponse>(
    "/leave-requests",
    payload
  );

  return data;
}

export async function getMyLeaveRequests(): Promise<LeaveRequestListResponse> {
  const { data } = await api.get<LeaveRequestListResponse>(
    "/leave-requests/me"
  );

  return data;
}

export async function getAllLeaveRequests(): Promise<LeaveRequestListResponse> {
  const { data } = await api.get<LeaveRequestListResponse>("/leave-requests");

  return data;
}

export async function reviewLeaveRequest(
  leaveId: number,
  payload: LeaveReviewPayload
): Promise<LeaveReviewResponse> {
  const { data } = await api.patch<LeaveReviewResponse>(
    `/leave-requests/${leaveId}`,
    payload
  );

  return data;
}

export async function cancelMyLeaveRequest(leaveId: number): Promise<void> {
  await api.delete(`/leave-requests/${leaveId}`);
}