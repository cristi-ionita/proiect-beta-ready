import { api } from "@/lib/axios";
import type {
  AssignmentItem,
  AssignmentListResponse,
  CloseAssignmentResponse,
  CreateAssignmentPayload,
} from "@/types/assignment.types";

export async function listAssignments(): Promise<AssignmentListResponse> {
  const { data } = await api.get<AssignmentListResponse>("/admin-assignments");
  return data;
}

export async function getRejectedAssignments(): Promise<AssignmentItem[]> {
  const { data } = await api.get<AssignmentItem[]>(
    "/admin-assignments/rejected"
  );
  return data;
}

export async function createAssignment(
  payload: CreateAssignmentPayload
): Promise<AssignmentItem> {
  const { data } = await api.post<AssignmentItem>(
    "/admin-assignments",
    payload
  );
  return data;
}

export async function closeAssignment(
  assignmentId: number
): Promise<CloseAssignmentResponse> {
  const { data } = await api.patch<CloseAssignmentResponse>(
    `/admin-assignments/${assignmentId}/close`
  );

  return data;
}

export async function deleteAssignment(assignmentId: number): Promise<void> {
  await api.delete(`/admin-assignments/${assignmentId}`);
}