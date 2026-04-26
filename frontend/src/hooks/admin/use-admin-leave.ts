"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import { getAllLeaveRequests, reviewLeaveRequest } from "@/services/leave.api";
import { isApiClientError } from "@/lib/api-error";
import type { LeaveRequestItem, LeaveStatus } from "@/services/leave.api";

type ReviewStatus = "approved" | "rejected";

type UseAdminLeaveParams = {
  loadErrorMessage: string;
  reviewErrorMessage: string;
};

type UseAdminLeaveResult = {
  requests: LeaveRequestItem[];
  loading: boolean;
  savingId: number | null;
  error: string;
  pendingCount: number;
  approvedCount: number;
  rejectedCount: number;
  refetch: () => Promise<void>;
  reviewRequest: (requestId: number, status: ReviewStatus) => Promise<void>;
};

export function useAdminLeave({
  loadErrorMessage,
  reviewErrorMessage,
}: UseAdminLeaveParams): UseAdminLeaveResult {
  const [requests, setRequests] = useState<LeaveRequestItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<number | null>(null);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const data = await getAllLeaveRequests();
      setRequests(Array.isArray(data?.requests) ? data.requests : []);
    } catch (err: unknown) {
      setRequests([]);
      setError(isApiClientError(err) ? err.message : loadErrorMessage);
    } finally {
      setLoading(false);
    }
  }, [loadErrorMessage]);

  useEffect(() => {
    void load();
  }, [load]);

  const reviewRequest = useCallback(
    async (requestId: number, status: ReviewStatus) => {
      try {
        setSavingId(requestId);
        setError("");

        await reviewLeaveRequest(requestId, { status });

        setRequests((prev) =>
          prev.map((item) =>
            item.id === requestId ? { ...item, status } : item
          )
        );
      } catch (err: unknown) {
        setError(isApiClientError(err) ? err.message : reviewErrorMessage);
      } finally {
        setSavingId(null);
      }
    },
    [reviewErrorMessage]
  );

  const pendingCount = useMemo(
    () => requests.filter((item) => item.status === "pending").length,
    [requests]
  );

  const approvedCount = useMemo(
    () => requests.filter((item) => item.status === "approved").length,
    [requests]
  );

  const rejectedCount = useMemo(
    () => requests.filter((item) => item.status === "rejected").length,
    [requests]
  );

  return {
    requests,
    loading,
    savingId,
    error,
    pendingCount,
    approvedCount,
    rejectedCount,
    refetch: load,
    reviewRequest,
  };
}