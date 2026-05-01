"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import { userLogin } from "@/services/auth.api";
import {
  clearAllAuth,
  getAdminToken,
  getSession,
  saveAdminToken,
  saveAppToken,
  saveSession,
} from "@/lib/auth";
import { isApiClientError } from "@/lib/api-error";
import { useI18n } from "@/lib/i18n/use-i18n";
import { authMessages } from "@/lib/i18n/auth-messages";
import { getTranslation, type Locale } from "@/lib/i18n";

export type LoginRole = "admin" | "employee" | "mechanic" | null;

type LoginText = {
  [key: string]: string;
  login: string;
  back: string;
  forgotPassword: string;
  toggleSecret: string;
  invalid: string;
  fill: string;
  error: string;
  registerSuccess: string;
  username: string;
  password: string;
  createEmployeeAccount: string;
  createMechanicAccount: string;
  admin: string;
  employee: string;
  mechanic: string;
  adminRoleMismatch: string;
  mechanicRoleMismatch: string;
  employeeRoleMismatch: string;
};

type BackendLoginUser = {
  id?: number;
  user_id?: number;
  full_name?: string;
  unique_code?: string | null;
  role?: string;
};

type UseLoginPageResult = {
  role: LoginRole;
  identifier: string;
  secret: string;
  showSecret: boolean;
  error: string;
  successMessage: string;
  loading: boolean;
  checking: boolean;
  mounted: boolean;
  text: LoginText;
  normalizedIdentifier: string;
  normalizedSecret: string;
  setIdentifier: (value: string) => void;
  setSecret: (value: string) => void;
  toggleShowSecret: () => void;
  handleRoleSelect: (nextRole: Exclude<LoginRole, null>) => void;
  handleBack: () => void;
  handleSubmit: (event: FormEvent<HTMLFormElement>) => Promise<void>;
};

function resolveUserId(user: BackendLoginUser): number | null {
  if (typeof user.user_id === "number" && Number.isFinite(user.user_id)) {
    return user.user_id;
  }

  if (typeof user.id === "number" && Number.isFinite(user.id)) {
    return user.id;
  }

  return null;
}

function getRoleMismatchMessage(
  role: Exclude<LoginRole, null>,
  text: LoginText
): string {
  if (role === "admin") return text.adminRoleMismatch;
  if (role === "mechanic") return text.mechanicRoleMismatch;
  return text.employeeRoleMismatch;
}

export function useLoginPage(): UseLoginPageResult {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { locale } = useI18n();

  const safeLocale: Locale =
    locale === "ro" || locale === "en" || locale === "de" ? locale : "de";

  const text = useMemo<LoginText>(
    () => ({
      ...authMessages[safeLocale],
      username: getTranslation(safeLocale, "common", "username"),
      password: getTranslation(safeLocale, "common", "password"),
      createEmployeeAccount: getTranslation(
        safeLocale,
        "common",
        "createEmployeeAccount"
      ),
      createMechanicAccount: getTranslation(
        safeLocale,
        "common",
        "createMechanicAccount"
      ),
      admin: getTranslation(safeLocale, "login", "admin"),
      employee: getTranslation(safeLocale, "login", "employee"),
      mechanic: getTranslation(safeLocale, "login", "mechanic"),
      adminRoleMismatch:
        safeLocale === "ro"
          ? "Acest cont nu este de administrator."
          : safeLocale === "de"
            ? "Dieses Konto ist kein Administratorkonto."
            : "This account is not an administrator account.",
      mechanicRoleMismatch:
        safeLocale === "ro"
          ? "Acest cont nu este de mecanic."
          : safeLocale === "de"
            ? "Dieses Konto ist kein Mechanikerkonto."
            : "This account is not a mechanic account.",
      employeeRoleMismatch:
        safeLocale === "ro"
          ? "Acest cont nu este de angajat."
          : safeLocale === "de"
            ? "Dieses Konto ist kein Mitarbeiterkonto."
            : "This account is not an employee account.",
    }),
    [safeLocale]
  );

  const [mounted, setMounted] = useState(false);
  const [role, setRole] = useState<LoginRole>(null);
  const [identifier, setIdentifierState] = useState("");
  const [secret, setSecretState] = useState("");
  const [showSecret, setShowSecret] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);

  const registered = searchParams.get("registered");

  const normalizedIdentifier = identifier.trim();
  const normalizedUsername = identifier.trim();
  const normalizedSecret = secret.trim();

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;

    if (getAdminToken()) {
      router.replace("/admin/dashboard");
      return;
    }

    const session = getSession();

    if (session?.role === "mechanic") {
      router.replace("/mechanic/dashboard");
      return;
    }

    if (session?.role === "employee") {
      router.replace("/employee/dashboard");
      return;
    }

    setChecking(false);
  }, [mounted, router]);

  useEffect(() => {
    if (registered === "success") {
      setSuccessMessage(text.registerSuccess);

      const timeout = setTimeout(() => {
        setSuccessMessage("");
        router.replace("/");
      }, 5000);

      return () => clearTimeout(timeout);
    }
  }, [registered, text.registerSuccess, router]);

  function resetForm() {
    setIdentifierState("");
    setSecretState("");
    setShowSecret(false);
    setError("");
  }

  function setIdentifier(value: string) {
    setIdentifierState(value);
    if (error) setError("");
  }

  function setSecret(value: string) {
    setSecretState(value);
    if (error) setError("");
  }

  function toggleShowSecret() {
    setShowSecret((prev) => !prev);
  }

  function handleRoleSelect(nextRole: Exclude<LoginRole, null>) {
    if (loading) return;
    resetForm();
    setRole(nextRole);
  }

  function handleBack() {
    if (loading) return;
    setRole(null);
    resetForm();
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!role) {
      setError(text.invalid);
      return;
    }

    if (!normalizedIdentifier || !normalizedSecret) {
      setError(text.fill);
      return;
    }

    setLoading(true);
    setError("");

    try {
      clearAllAuth();

      const response = await userLogin({
        username: normalizedUsername,
        password: normalizedSecret,
      });

      const backendUser = (response.user ?? {}) as BackendLoginUser;
      const backendRole = backendUser.role;
      const resolvedUserId = resolveUserId(backendUser);

      if (!resolvedUserId || !backendRole || !backendUser.full_name) {
        throw new Error("Invalid login response.");
      }

      if (role !== backendRole) {
        clearAllAuth();
        setError(getRoleMismatchMessage(role, text));
        return;
      }

      if (backendRole === "admin") {
        saveAdminToken(response.access_token);
        router.replace("/admin/dashboard");
        return;
      }

      saveAppToken(response.access_token);
      saveSession({
        user_id: resolvedUserId,
        full_name: backendUser.full_name,
        shift_number: null,
        unique_code: backendUser.unique_code ?? normalizedIdentifier,
        role: backendRole === "mechanic" ? "mechanic" : "employee",
      });

      if (backendRole === "mechanic") {
        router.replace("/mechanic/dashboard");
        return;
      }

      router.replace("/employee/dashboard");
    } catch (err: unknown) {
      setError(isApiClientError(err) ? err.message || text.invalid : text.error);
    } finally {
      setLoading(false);
    }
  }

  return {
    role,
    identifier,
    secret,
    showSecret,
    error,
    successMessage,
    loading,
    checking,
    mounted,
    text,
    normalizedIdentifier,
    normalizedSecret,
    setIdentifier,
    setSecret,
    toggleShowSecret,
    handleRoleSelect,
    handleBack,
    handleSubmit,
  };
}