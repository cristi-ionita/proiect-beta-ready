import axios, { AxiosHeaders } from "axios";

import { normalizeApiError } from "./api-error";
import { clearAllAuth, getAdminToken, getAppToken } from "./auth";

export const api = axios.create({
  baseURL: "/api",
  timeout: 15000,
});

function getLanguage(): string {
  if (typeof window === "undefined") return "ro";

  try {
    const stored = window.localStorage.getItem("lang")?.trim().toLowerCase();

    if (stored === "ro" || stored === "en" || stored === "de") {
      return stored;
    }
  } catch {
    // ignore storage failures
  }

  const browserLang = window.navigator.language?.split("-")[0]?.toLowerCase();

  if (browserLang === "ro" || browserLang === "en" || browserLang === "de") {
    return browserLang;
  }

  return "ro";
}

function normalizeHeaders(headers?: unknown): AxiosHeaders {
  if (headers instanceof AxiosHeaders) return headers;

  if (typeof headers === "string") {
    return AxiosHeaders.from(headers);
  }

  if (headers && typeof headers === "object") {
    return AxiosHeaders.from(headers as Record<string, string>);
  }

  return new AxiosHeaders();
}

function redirectToLogin(): void {
  if (typeof window === "undefined") return;

  clearAllAuth();

  const currentPath = window.location.pathname + window.location.search;

  if (currentPath === "/") return;

  window.location.replace("/?sessionExpired=1");
}

api.interceptors.request.use((config) => {
  const adminToken = getAdminToken();
  const appToken = getAppToken();
  const token = adminToken ?? appToken;

  const headers = normalizeHeaders(config.headers);

  headers.set("Accept", "application/json");
  headers.set("Accept-Language", getLanguage());

  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  } else {
    headers.delete("Authorization");
  }

  headers.delete("X-User-Code");

  config.headers = headers;

  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error: unknown) => {
    const normalizedError = normalizeApiError(error);

    if (normalizedError.status === 401) {
      redirectToLogin();
    }

    return Promise.reject(normalizedError);
  }
);