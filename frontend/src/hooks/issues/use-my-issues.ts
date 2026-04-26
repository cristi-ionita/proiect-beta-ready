"use client";

import { useEffect, useState } from "react";

import { isApiClientError } from "@/lib/api-error";
import { listMyIssues } from "@/services/issues.api";
import type { IssueItem } from "@/types/issue.types";

type UseMyIssuesResult = {
  data: IssueItem[];
  loading: boolean;
  error: string;
  refetch: () => Promise<void>;
};

export function useMyIssues(): UseMyIssuesResult {
  const [data, setData] = useState<IssueItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function load() {
    try {
      setLoading(true);
      setError("");

      const result = await listMyIssues();
      setData(result.issues);
    } catch (err: unknown) {
      setData([]);
      setError(
        isApiClientError(err) ? err.message : "Could not load your issues."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  return {
    data,
    loading,
    error,
    refetch: load,
  };
}