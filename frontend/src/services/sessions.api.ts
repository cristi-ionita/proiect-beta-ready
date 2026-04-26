import { api } from "@/lib/axios";
import type {
  HandoverEndPayload,
  HandoverEndResponse,
  HandoverStartPayload,
  HandoverStartResponse,
  SessionPageResponse,
} from "@/types/session.types";

export async function getSessionPage(
  assignmentId: number
): Promise<SessionPageResponse> {
  const { data } = await api.get<SessionPageResponse>(
    `/sessions/${assignmentId}`
  );
  return data;
}

export async function saveHandoverStart(
  assignmentId: number,
  payload: HandoverStartPayload
): Promise<HandoverStartResponse> {
  const { data } = await api.post<HandoverStartResponse>(
    `/sessions/${assignmentId}/handover-start`,
    payload
  );
  return data;
}

export async function saveHandoverEnd(
  assignmentId: number,
  payload: HandoverEndPayload
): Promise<HandoverEndResponse> {
  const { data } = await api.post<HandoverEndResponse>(
    `/sessions/${assignmentId}/handover-end`,
    payload
  );
  return data;
}