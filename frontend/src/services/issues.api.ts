import { api } from "@/lib/axios";
import type {
  CreateIssuePayload,
  IssueItem,
  IssuesResponse,
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
  form.append("need_brakes", String(payload.need_brakes ?? false));
  form.append("need_tires", String(payload.need_tires ?? false));
  form.append("need_oil", String(payload.need_oil ?? false));

  if (payload.need_service_in_km !== undefined) {
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
// UPDATE
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

export async function mechanicUpdateIssue(
  issueId: number,
  payload: UpdateIssuePayload
): Promise<IssueItem> {
  const { data } = await api.patch<IssueItem>(
    `/vehicle-issues/${issueId}/mechanic`,
    payload
  );

  return data;
}

// =========================
// 🔥 NEW: DOWNLOAD PHOTO (CA LA DOCUMENTE)
// =========================

export async function adminDownloadIssuePhoto(
  photoId: number
): Promise<Blob> {
  const response = await api.get(
    `/vehicle-issues/photos/${photoId}`,
    {
      responseType: "blob",
    }
  );

  return response.data;
}