"use client";

import { useCallback, useEffect, useState } from "react";

import { listIssues } from "@/services/issues.api";
import { isApiClientError } from "@/lib/api-error";
import type { IssueItem } from "@/types/issue.types";

type UseAdminIssueDetailsParams = {
  issueId: number;
  errorMessage: string;
};

type UseAdminIssueDetailsResult = {
  issue: IssueItem | null;
  loading: boolean;
  error: string;
  refetch: () => Promise<void>;
};

export function useAdminIssueDetails({
  issueId,
  errorMessage,
}: UseAdminIssueDetailsParams): UseAdminIssueDetailsResult {
  const [issue, setIssue] = useState<IssueItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    if (!issueId || Number.isNaN(issueId)) {
      setIssue(null);
      setError("");
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError("");

      const result = await listIssues();
      const safeIssues = Array.isArray(result?.issues) ? result.issues : [];
      const foundIssue = safeIssues.find((item) => item.id === issueId) ?? null;

      setIssue(foundIssue);
    } catch (err: unknown) {
      setIssue(null);
      setError(isApiClientError(err) ? err.message : errorMessage);
    } finally {
      setLoading(false);
    }
  }, [issueId, errorMessage]);

  useEffect(() => {
    void load();
  }, [load]);

  return {
    issue,
    loading,
    error,
    refetch: load,
  };
}