"use client";

import { useCallback, useEffect, useState } from "react";

import { listIssues } from "@/services/issues.api";
import { isApiClientError } from "@/lib/api-error";
import type { IssueItem } from "@/types/issue.types";

type UseAdminIssuesResult = {
  issues: IssueItem[];
  loading: boolean;
  error: string;
  refetch: () => Promise<void>;
};

export function useAdminIssues(): UseAdminIssuesResult {
  const [issues, setIssues] = useState<IssueItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const data = await listIssues();

      setIssues(Array.isArray(data?.issues) ? data.issues : []);
    } catch (err: unknown) {
      setIssues([]);
      setError(isApiClientError(err) ? err.message : "Eroare la încărcare");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  return {
    issues,
    loading,
    error,
    refetch: load,
  };
}