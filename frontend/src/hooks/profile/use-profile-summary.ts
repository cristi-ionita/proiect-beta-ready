"use client";

import { useEffect, useState } from "react";

import { isApiClientError } from "@/lib/api-error";
import { getMyProfileSummary } from "@/services/profile.api";
import type { ProfileSummaryResponse } from "@/types/profile.types";

type UseProfileSummaryResult = {
  data: ProfileSummaryResponse | null;
  loading: boolean;
  error: string;
  refetch: () => Promise<void>;
};

export function useProfileSummary(): UseProfileSummaryResult {
  const [data, setData] = useState<ProfileSummaryResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function load() {
    try {
      setLoading(true);
      setError("");

      const result = await getMyProfileSummary();
      setData(result);
    } catch (err: unknown) {
      setData(null);
      setError(
        isApiClientError(err) ? err.message : "Could not load profile summary."
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