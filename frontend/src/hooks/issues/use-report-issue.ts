"use client";

import { useState } from "react";

import { isApiClientError } from "@/lib/api-error";
import { createMyIssue } from "@/services/issues.api";
import type {
  CreateIssuePayload,
  CreateIssueResponse,
} from "@/types/issue.types";

type UseReportIssueResult = {
  loading: boolean;
  error: string;
  success: string;
  submit: (payload: CreateIssuePayload) => Promise<CreateIssueResponse | null>;
};

export function useReportIssue(): UseReportIssueResult {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  async function submit(
    payload: CreateIssuePayload
  ): Promise<CreateIssueResponse | null> {
    try {
      setLoading(true);
      setError("");
      setSuccess("");

      const result = await createMyIssue(payload);
      setSuccess("Issue reported successfully.");

      return result;
    } catch (err: unknown) {
      setError(
        isApiClientError(err) ? err.message : "Could not report issue."
      );
      return null;
    } finally {
      setLoading(false);
    }
  }

  return {
    loading,
    error,
    success,
    submit,
  };
}