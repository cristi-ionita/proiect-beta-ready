"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import { listMechanicIssues } from "@/services/issues.api";
import { isApiClientError } from "@/lib/api-error";
import type { IssueItem } from "@/types/issue.types";

type MechanicIssuesCounts = {
  total: number;
  open: number;
  scheduled: number;
  resolved: number;
};

type UseMechanicIssuesResult = {
  issues: IssueItem[];
  openIssues: IssueItem[];
  scheduledIssues: IssueItem[];
  resolvedIssues: IssueItem[];
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

  const openIssues = useMemo(() => {
    return issues.filter((item) => {
      const status = normalizeStatus(item.status);
      return status === "open" || status === "in_progress";
    });
  }, [issues]);

  const scheduledIssues = useMemo(() => {
    return issues.filter(
      (item) => normalizeStatus(item.status) === "scheduled"
    );
  }, [issues]);

  const resolvedIssues = useMemo(() => {
    return issues.filter(
      (item) => normalizeStatus(item.status) === "resolved"
    );
  }, [issues]);

  const counts = useMemo<MechanicIssuesCounts>(() => {
    return {
      total: issues.length,
      open: openIssues.length,
      scheduled: scheduledIssues.length,
      resolved: resolvedIssues.length,
    };
  }, [issues.length, openIssues.length, scheduledIssues.length, resolvedIssues.length]);

  return {
    issues,
    openIssues,
    scheduledIssues,
    resolvedIssues,
    counts,
    loading,
    error,
    refetch: load,
  };
}