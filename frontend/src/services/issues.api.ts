import { api } from "@/lib/axios";
import type {
  CreateIssuePayload,
  IssueItem,
  IssuesResponse,
  UpdateIssuePayload,
} from "@/types/issue.types";

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

export async function createMyIssue(
  payload: CreateIssuePayload
): Promise<IssueItem> {
  const { data } = await api.post<IssueItem>("/vehicle-issues", payload);
  return data;
}

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