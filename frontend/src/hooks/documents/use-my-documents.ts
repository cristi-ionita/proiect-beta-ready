"use client";

import { useEffect, useState } from "react";

import { isApiClientError } from "@/lib/api-error";
import { getMyDocuments } from "@/services/documents.api";
import type { DocumentItem } from "@/types/document.types";

type UseMyDocumentsResult = {
  data: DocumentItem[];
  loading: boolean;
  error: string;
  refetch: () => Promise<void>;
};

export function useMyDocuments(): UseMyDocumentsResult {
  const [data, setData] = useState<DocumentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function load() {
    try {
      setLoading(true);
      setError("");

      const result = await getMyDocuments();
      setData(result);
    } catch (err: unknown) {
      setData([]);
      setError(
        isApiClientError(err) ? err.message : "Could not load your documents."
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