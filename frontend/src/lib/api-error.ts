import axios, { type AxiosError } from "axios";

export type ApiErrorResponse = {
  error?: string;
  code?: string;
  message?: string;
  details?: Array<{ msg?: string }>;
};

export type ApiClientError = {
  error?: string;
  code?: string;
  message: string;
  details?: Array<{ msg?: string }>;
  status?: number;
};

export function normalizeApiError(error: unknown): ApiClientError {
  if (!axios.isAxiosError<ApiErrorResponse>(error)) {
    return {
      error: "UNKNOWN_ERROR",
      code: "errors.unknown",
      message: "Unexpected error.",
    };
  }

  const axiosError = error as AxiosError<ApiErrorResponse>;
  const status = axiosError.response?.status;
  const data = axiosError.response?.data;

  if (data?.message && typeof data.message === "string") {
    return {
      error: data.error,
      code: data.code,
      message: data.message,
      details: data.details,
      status,
    };
  }

  if (Array.isArray(data?.details) && data.details.length > 0) {
    return {
      error: data.error,
      code: data.code,
      message: data.details
        .map((item) => item?.msg || "Invalid value")
        .join(", "),
      details: data.details,
      status,
    };
  }

  if (status === 400) {
    return {
      error: "BAD_REQUEST",
      code: "errors.http.bad_request",
      message: "Invalid request.",
      status,
    };
  }

  if (status === 401) {
    return {
      error: "UNAUTHORIZED",
      code: "errors.http.unauthorized",
      message: "You are not authenticated.",
      status,
    };
  }

  if (status === 403) {
    return {
      error: "FORBIDDEN",
      code: "errors.http.forbidden",
      message: "Access denied.",
      status,
    };
  }

  if (status === 404) {
    return {
      error: "NOT_FOUND",
      code: "errors.http.not_found",
      message: "Resource not found.",
      status,
    };
  }

  if (status === 409) {
    return {
      error: "CONFLICT",
      code: "errors.http.conflict",
      message: "Conflict.",
      status,
    };
  }

  if (status === 422) {
    return {
      error: "VALIDATION_ERROR",
      code: "errors.validation.invalid_request",
      message: "Validation error.",
      status,
    };
  }

  if (status === 408) {
    return {
      error: "REQUEST_TIMEOUT",
      code: "errors.http.timeout",
      message: "Request timed out.",
      status,
    };
  }

  if (status && status >= 500) {
    return {
      error: "INTERNAL_SERVER_ERROR",
      code: "errors.internal",
      message: "Server error. Please try again.",
      status,
    };
  }

  if (error.code === "ECONNABORTED") {
    return {
      error: "REQUEST_TIMEOUT",
      code: "errors.http.timeout",
      message: "Request timed out.",
      status,
    };
  }

  return {
    error: "UNKNOWN_ERROR",
    code: "errors.unknown",
    message: "Unexpected error.",
    status,
  };
}

export function isApiClientError(error: unknown): error is ApiClientError {
  return (
    typeof error === "object" &&
    error !== null &&
    "message" in error &&
    typeof (error as { message?: unknown }).message === "string"
  );
}