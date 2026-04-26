"use client";

import { useCallback, useEffect, useState } from "react";

import { isApiClientError } from "@/lib/api-error";
import { getMyDocuments } from "@/services/documents.api";
import { listMyIssues } from "@/services/issues.api";
import { getMyProfileSummary } from "@/services/profile.api";
import { getMyVehicle } from "@/services/my-vehicle.api";

import type { DocumentItem } from "@/types/document.types";
import type { IssueItem } from "@/types/issue.types";
import type { ProfileSummaryResponse } from "@/types/profile.types";
import type { MyVehicleResponse } from "@/services/my-vehicle.api"; // ✅ tip corect

type EmployeeDashboardData = {
  profile: ProfileSummaryResponse | null;
  vehicle: MyVehicleResponse | null; // ✅ FIX AICI
  documents: DocumentItem[];
  issues: IssueItem[];
};

type UseEmployeeDashboardResult = {
  data: EmployeeDashboardData;
  loading: boolean;
  error: string;
  refetch: () => Promise<void>;
};

const initialData: EmployeeDashboardData = {
  profile: null,
  vehicle: null,
  documents: [],
  issues: [],
};

export function useEmployeeDashboard(): UseEmployeeDashboardResult {
  const [data, setData] = useState<EmployeeDashboardData>(initialData);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const [profile, vehicle, documents, issuesResponse] = await Promise.all([
        getMyProfileSummary(),
        getMyVehicle(), // ✅ corect
        getMyDocuments(),
        listMyIssues(),
      ]);

      setData({
        profile,
        vehicle,
        documents,
        issues: issuesResponse.issues,
      });
    } catch (err: unknown) {
      setData(initialData);
      setError(
        isApiClientError(err)
          ? err.message
          : "Could not load employee dashboard."
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