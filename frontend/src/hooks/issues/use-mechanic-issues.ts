"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import { isApiClientError } from "@/lib/api-error";
import { listMechanicIssues } from "@/services/issues.api";
import {
  VEHICLE_ISSUE_STATUS,
  type IssueItem,
} from "@/types/issue.types";

type MechanicIssuesCounts = {
  total: number;
  scheduled: number;
  inProgress: number;
  resolved: number;
  canceled: number;
};

type UseMechanicIssuesResult = {
  issues: IssueItem[];
  scheduledIssues: IssueItem[];
  inProgressIssues: IssueItem[];
  resolvedIssues: IssueItem[];
  canceledIssues: IssueItem[];
  activeIssues: IssueItem[];
  counts: MechanicIssuesCounts;
  loading: boolean;
  error: string;
  refetch: () => Promise<void>;
};

function normalizeStatus(status?: string | null): string {
  return (status || "").trim().toLowerCase();
}

export function useMechanicIssues(): UseMechanicIssuesResult {
  const [issues, setIssues] = useState<IssueItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const data = await listMechanicIssues();
      setIssues(Array.isArray(data?.issues) ? data.issues : []);
    } catch (err: unknown) {
      setIssues([]);
      setError(
        isApiClientError(err) && typeof err.message === "string"
          ? err.message
          : "Failed to load mechanic issues."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const scheduledIssues = useMemo(() => {
    return issues.filter(
      (item) => normalizeStatus(item.status) === VEHICLE_ISSUE_STATUS.SCHEDULED
    );
  }, [issues]);

  const inProgressIssues = useMemo(() => {
    return issues.filter(
      (item) =>
        normalizeStatus(item.status) === VEHICLE_ISSUE_STATUS.IN_PROGRESS
    );
  }, [issues]);

  const resolvedIssues = useMemo(() => {
    return issues.filter(
      (item) => normalizeStatus(item.status) === VEHICLE_ISSUE_STATUS.RESOLVED
    );
  }, [issues]);

  const canceledIssues = useMemo(() => {
    return issues.filter(
      (item) => normalizeStatus(item.status) === VEHICLE_ISSUE_STATUS.CANCELED
    );
  }, [issues]);

  const activeIssues = useMemo(() => {
    return issues.filter((item) => {
      const status = normalizeStatus(item.status);

      return (
        status === VEHICLE_ISSUE_STATUS.SCHEDULED ||
        status === VEHICLE_ISSUE_STATUS.IN_PROGRESS
      );
    });
  }, [issues]);

  const counts = useMemo<MechanicIssuesCounts>(() => {
    return {
      total: issues.length,
      scheduled: scheduledIssues.length,
      inProgress: inProgressIssues.length,
      resolved: resolvedIssues.length,
      canceled: canceledIssues.length,
    };
  }, [
    issues.length,
    scheduledIssues.length,
    inProgressIssues.length,
    resolvedIssues.length,
    canceledIssues.length,
  ]);

  return {
    issues,
    scheduledIssues,
    inProgressIssues,
    resolvedIssues,
    canceledIssues,
    activeIssues,
    counts,
    loading,
    error,
    refetch: load,
  };
}