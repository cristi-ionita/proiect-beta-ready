"use client";

import { useState, type FormEvent } from "react";

import { authMessages } from "@/lib/i18n/auth-messages";
import { register } from "@/services/auth.api";
import { isApiClientError } from "@/lib/api-error";
import { useI18n } from "@/lib/i18n/use-i18n";

type SupportedLocale = "ro" | "en" | "de";

type RegisterText = {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  confirmPassword: string;
  createAccount: string;
  creating: string;
  backToLogin: string;
  fillAll: string;
  passwordMin: string;
  passwordsMatch: string;
  createError: string;
  togglePassword: string;
  toggleConfirmPassword: string;
};

type UseRegisterPageResult = {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  confirmPassword: string;
  showPassword: boolean;
  showConfirmPassword: boolean;
  loading: boolean;
  error: string;
  success: boolean;
  successMessage: string;
  text: RegisterText;
  setFirstName: (value: string) => void;
  setLastName: (value: string) => void;
  setEmail: (value: string) => void;
  setPassword: (value: string) => void;
  setConfirmPassword: (value: string) => void;
  toggleShowPassword: () => void;
  toggleShowConfirmPassword: () => void;
  handleSubmit: (event: FormEvent<HTMLFormElement>) => Promise<void>;
};

export function useRegisterPage(): UseRegisterPageResult {
  const { locale } = useI18n();

  const safeLocale: SupportedLocale =
    locale === "ro" || locale === "en" || locale === "de" ? locale : "en";

  const [firstName, setFirstNameState] = useState("");
  const [lastName, setLastNameState] = useState("");
  const [email, setEmailState] = useState("");
  const [password, setPasswordState] = useState("");
  const [confirmPassword, setConfirmPasswordState] = useState("");

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  const text = authMessages[safeLocale];

  function clearError() {
    if (error) {
      setError("");
    }
  }

  function setFirstName(value: string) {
    setFirstNameState(value);
    clearError();
  }

  function setLastName(value: string) {
    setLastNameState(value);
    clearError();
  }

  function setEmail(value: string) {
    setEmailState(value);
    clearError();
  }

  function setPassword(value: string) {
    setPasswordState(value);
    clearError();
  }

  function setConfirmPassword(value: string) {
    setConfirmPasswordState(value);
    clearError();
  }

  function toggleShowPassword() {
    setShowPassword((prev) => !prev);
  }

  function toggleShowConfirmPassword() {
    setShowConfirmPassword((prev) => !prev);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const normalizedFirstName = firstName.trim();
    const normalizedLastName = lastName.trim();
    const normalizedEmail = email.trim().toLowerCase();
    const normalizedPassword = password.trim();
    const normalizedConfirmPassword = confirmPassword.trim();

    if (
      !normalizedFirstName ||
      !normalizedLastName ||
      !normalizedEmail ||
      !normalizedPassword ||
      !normalizedConfirmPassword
    ) {
      setError(text.fillAll);
      return;
    }

    if (normalizedPassword.length < 8) {
      setError(text.passwordMin);
      return;
    }

    if (normalizedPassword !== normalizedConfirmPassword) {
      setError(text.passwordsMatch);
      return;
    }

    try {
      setLoading(true);
      setError("");
      setSuccess(false);
      setSuccessMessage("");

      await register({
        full_name: `${normalizedFirstName} ${normalizedLastName}`,
        email: normalizedEmail,
        password: normalizedPassword,
        role: "employee",
      });

      setSuccess(true);
      setSuccessMessage(
        "Cererea de înregistrare a fost trimisă. Așteaptă aprobarea administratorului."
      );

      setFirstNameState("");
      setLastNameState("");
      setEmailState("");
      setPasswordState("");
      setConfirmPasswordState("");
    } catch (err: unknown) {
      setError(isApiClientError(err) ? err.message : text.createError);
    } finally {
      setLoading(false);
    }
  }

  return {
    firstName,
    lastName,
    email,
    password,
    confirmPassword,
    showPassword,
    showConfirmPassword,
    loading,
    error,
    success,
    successMessage,
    text,
    setFirstName,
    setLastName,
    setEmail,
    setPassword,
    setConfirmPassword,
    toggleShowPassword,
    toggleShowConfirmPassword,
    handleSubmit,
  };
}