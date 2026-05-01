import { api } from "@/lib/axios";
import type {
  CreateIssuePayload,
  IssueItem,
  IssuesResponse,
  MechanicUpdateIssuePayload,
  UpdateIssuePayload,
} from "@/types/issue.types";

// =========================
// LIST
// =========================

export async function listIssues(): Promise<IssuesResponse> {
  const { data } = await api.get<IssuesResponse>("/vehicle-issues");
  return data;
}

export async function listMyIssues(): Promise<IssuesResponse> {
  const { data } = await api.get<IssuesResponse>("/vehicle-issues/me");
  return data;
}

export async function listMechanicIssues(): Promise<IssuesResponse> {
  const { data } = await api.get<IssuesResponse>("/vehicle-issues/mechanic");
  return data;
}

// =========================
// CREATE
// =========================

export async function createMyIssue(
  payload: CreateIssuePayload
): Promise<IssueItem> {
  const form = new FormData();

  form.append("priority", payload.priority ?? "medium");
  form.append("need_brakes", String(payload.need_brakes));
  form.append("need_tires", String(payload.need_tires));
  form.append("need_oil", String(payload.need_oil));

  if (
    payload.need_service_in_km !== undefined &&
    payload.need_service_in_km !== null
  ) {
    form.append("need_service_in_km", String(payload.need_service_in_km));
  }

  if (payload.dashboard_checks?.trim()) {
    form.append("dashboard_checks", payload.dashboard_checks.trim());
  }

  if (payload.other_problems?.trim()) {
    form.append("other_problems", payload.other_problems.trim());
  }

  payload.files?.forEach((file) => {
    form.append("files", file);
  });

  const { data } = await api.post<IssueItem>("/vehicle-issues", form);
  return data;
}

// =========================
// ADMIN UPDATE
// =========================

export async function updateIssueStatus(
  issueId: number,
  payload: UpdateIssuePayload
): Promise<IssueItem> {
  const { data } = await api.patch<IssueItem>(
    `/vehicle-issues/${issueId}/status`,
    payload
  );

  return data;
}

export async function assignIssueToMechanic(
  issueId: number,
  mechanicId: number
): Promise<IssueItem> {
  return updateIssueStatus(issueId, {
    assigned_mechanic_id: mechanicId,
  });
}

// =========================
// MECHANIC UPDATE
// =========================

export async function mechanicUpdateIssue(
  issueId: number,
  payload: MechanicUpdateIssuePayload
): Promise<IssueItem> {
  const { data } = await api.patch<IssueItem>(
    `/vehicle-issues/${issueId}/mechanic`,
    payload
  );

  return data;
}

export async function mechanicScheduleIssue(
  issueId: number,
  payload: {
    scheduled_for: string;
    scheduled_location?: string | null;
  }
): Promise<IssueItem> {
  return mechanicUpdateIssue(issueId, {
    status: "scheduled",
    scheduled_for: payload.scheduled_for,
    scheduled_location: payload.scheduled_location ?? null,
  });
}

export async function mechanicStartIssue(issueId: number): Promise<IssueItem> {
  return mechanicUpdateIssue(issueId, {
    status: "in_progress",
  });
}

export async function mechanicResolveIssue(
  issueId: number,
  payload: {
    resolution_notes?: string | null;
    final_cost?: number | null;
  }
): Promise<IssueItem> {
  return mechanicUpdateIssue(issueId, {
    status: "resolved",
    resolution_notes: payload.resolution_notes ?? null,
    final_cost: payload.final_cost ?? null,
  });
}

export async function mechanicCancelIssue(
  issueId: number,
  payload?: {
    resolution_notes?: string | null;
  }
): Promise<IssueItem> {
  return mechanicUpdateIssue(issueId, {
    status: "canceled",
    resolution_notes: payload?.resolution_notes ?? null,
  });
}

// =========================
// PHOTOS
// =========================

export async function adminDownloadIssuePhoto(photoId: number): Promise<Blob> {
  const response = await api.get(`/vehicle-issues/photos/${photoId}`, {
    responseType: "blob",
  });

  return response.data;
}