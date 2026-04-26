import { api } from "@/lib/axios";
import type {
  ProfileSummaryResponse,
  UpdateMyAccountPayload,
  UpdateMyProfilePayload,
} from "@/types/profile.types";

export async function getMyProfileSummary(): Promise<ProfileSummaryResponse> {
  const { data } = await api.get<ProfileSummaryResponse>(
    "/employee-profiles/summary/me"
  );

  return data;
}

export async function updateMyProfile(
  payload: UpdateMyProfilePayload
): Promise<void> {
  await api.put("/employee-profiles/me", payload);
}

export async function updateMyAccount(
  payload: UpdateMyAccountPayload
) {
  const { data } = await api.put("/auth/me", payload);
  return data;
}

export async function getMyAccount() {
  const { data } = await api.get("/auth/me");
  return data;
}