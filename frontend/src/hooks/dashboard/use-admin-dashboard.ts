"use client";

import { useCallback, useEffect, useState } from "react";

import { isApiClientError } from "@/lib/api-error";
import { getAdminDashboardSummary } from "@/services/dashboard.api";
import type {
  AdminDashboardData,
  AdminDashboardSummaryResponse,
} from "@/types/dashboard.types";

type UseAdminDashboardResult = {
  data: AdminDashboardData;
  loading: boolean;
  error: string;
  refetch: () => Promise<void>;
};

const initialData: AdminDashboardData = {
  workingTodayUsers: 0,
  todayLeaves: 0,
  availableVehicles: 0,
  pendingUsers: 0,
  issues: [],
  activeAssignments: [],
};

function mapAdminDashboardData(
  summary: AdminDashboardSummaryResponse
): AdminDashboardData {
  return {
    workingTodayUsers: summary.users.working_today,
    todayLeaves: summary.users.on_leave_today,
    availableVehicles: summary.vehicles.available,
    pendingUsers: summary.users.pending,
    issues: Array.isArray(summary.recent_issues) ? summary.recent_issues : [],
    activeAssignments: Array.isArray(summary.active_assignments)
      ? summary.active_assignments
      : [],
  };
}

export function useAdminDashboard(): UseAdminDashboardResult {
  const [data, setData] = useState<AdminDashboardData>(initialData);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const summary = await getAdminDashboardSummary();
      setData(mapAdminDashboardData(summary));
    } catch (err: unknown) {
      setData(initialData);
      setError(
        isApiClientError(err) ? err.message : "Failed to load dashboard data."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  return {
    data,
    loading,
    error,
    refetch: load,
  };
}