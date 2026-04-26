import { api } from "@/lib/axios";
import type { AdminDashboardSummaryResponse } from "@/types/dashboard.types";

export async function getAdminDashboardSummary(): Promise<AdminDashboardSummaryResponse> {
  const { data } = await api.get<AdminDashboardSummaryResponse>(
    "/admin-dashboard/summary"
  );

  return data;
}