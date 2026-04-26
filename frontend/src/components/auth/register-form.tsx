"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import { ArrowLeft, CheckCircle, UserPlus, Wrench } from "lucide-react";

import PasswordField from "@/components/auth/PasswordField";
import { register } from "@/services/auth.api";
import { isApiClientError } from "@/lib/api-error";

type RegisterRole = "employee" | "mechanic";

type RegisterFormProps = {
  role: RegisterRole;
  submitLabel: string;
  successMessage: string;
};

export default function RegisterForm({
  role,
  submitLabel,
  successMessage,
}: RegisterFormProps) {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const normalizedFirstName = firstName.trim();
    const normalizedLastName = lastName.trim();
    const normalizedUsername = username.trim();
    const normalizedEmail = email.trim().toLowerCase();
    const normalizedPassword = password.trim();
    const normalizedConfirmPassword = confirmPassword.trim();

    if (
      !normalizedFirstName ||
      !normalizedLastName ||
      !normalizedUsername ||
      !normalizedEmail ||
      !normalizedPassword ||
      !normalizedConfirmPassword
    ) {
      setError("Completează toate câmpurile.");
      return;
    }

    if (normalizedUsername.length < 3) {
      setError("Username-ul trebuie să aibă minimum 3 caractere.");
      return;
    }

    if (!/^[a-zA-Z0-9._-]+$/.test(normalizedUsername)) {
      setError(
        "Username-ul poate conține doar litere, cifre, punct, underscore și cratimă."
      );
      return;
    }

    if (normalizedPassword.length < 8) {
      setError("Parola trebuie să aibă minimum 8 caractere.");
      return;
    }

    if (normalizedPassword !== normalizedConfirmPassword) {
      setError("Parolele nu coincid.");
      return;
    }

    try {
      setLoading(true);
      setError("");

      await register({
        full_name: `${normalizedFirstName} ${normalizedLastName}`,
        username: normalizedUsername,
        email: normalizedEmail,
        password: normalizedPassword,
        role,
      });

      setSuccess(true);

      setFirstName("");
      setLastName("");
      setUsername("");
      setEmail("");
      setPassword("");
      setConfirmPassword("");
    } catch (err: unknown) {
      setError(
        isApiClientError(err)
          ? err.message
          : "Nu am putut trimite cererea de înregistrare."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="w-full max-w-[640px] rounded-[24px] border border-white/10 bg-gradient-to-b from-white to-slate-50 p-4 md:p-5 shadow-[0_20px_60px_rgba(0,0,0,0.22)] backdrop-blur-xl"
    >
      {!success ? (
        <div className="grid gap-3 md:grid-cols-2">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">
              Prenume
            </label>
            <input
              value={firstName}
              onChange={(event) => setFirstName(event.target.value)}
              autoComplete="given-name"
              placeholder="Prenume"
              className="h-11 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm text-slate-900 outline-none transition-all duration-200 focus:border-slate-300 focus:ring-2 focus:ring-slate-200"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">
              Nume
            </label>
            <input
              value={lastName}
              onChange={(event) => setLastName(event.target.value)}
              autoComplete="family-name"
              placeholder="Nume"
              className="h-11 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm text-slate-900 outline-none transition-all duration-200 focus:border-slate-300 focus:ring-2 focus:ring-slate-200"
            />
          </div>

          <div className="md:col-span-2">
            <label className="mb-1.5 block text-sm font-medium text-slate-700">
              Username
            </label>
            <input
              type="text"
              value={username}
              onChange={(event) => setUsername(event.target.value)}
              autoComplete="username"
              autoCapitalize="none"
              autoCorrect="off"
              spellCheck={false}
              placeholder="username"
              className="h-11 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm text-slate-900 outline-none transition-all duration-200 focus:border-slate-300 focus:ring-2 focus:ring-slate-200"
            />
          </div>

          <div className="md:col-span-2">
            <label className="mb-1.5 block text-sm font-medium text-slate-700">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              autoComplete="email"
              autoCapitalize="none"
              autoCorrect="off"
              spellCheck={false}
              placeholder="email@exemplu.ro"
              className="h-11 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm text-slate-900 outline-none transition-all duration-200 focus:border-slate-300 focus:ring-2 focus:ring-slate-200"
            />
          </div>

          <PasswordField
            label="Parolă"
            value={password}
            onChange={setPassword}
            show={showPassword}
            onToggle={() => setShowPassword((prev) => !prev)}
          />

          <PasswordField
            label="Confirmă parola"
            value={confirmPassword}
            onChange={setConfirmPassword}
            show={showConfirmPassword}
            onToggle={() => setShowConfirmPassword((prev) => !prev)}
          />
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-5 text-center">
          <CheckCircle className="h-12 w-12 text-green-500" />
          <p className="mt-3 text-sm font-semibold text-slate-800">
            {successMessage}
          </p>
          <p className="mt-2 max-w-md text-sm text-slate-600">
            Ți-am trimis un email de confirmare. Apasă pe linkul din email pentru
            a verifica adresa, apoi contul tău va putea fi aprobat de
            administrator.
          </p>
        </div>
      )}

      {error ? (
        <div
          className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-600"
          role="alert"
          aria-live="polite"
        >
          {error}
        </div>
      ) : null}

      <div className="mt-4 flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Link
          href="/"
          className="inline-flex h-11 min-w-[170px] items-center justify-center gap-2 rounded-xl bg-black px-4 text-sm font-semibold text-white shadow-sm transition-all duration-200 hover:bg-slate-800 hover:shadow-md"
        >
          <ArrowLeft className="h-4 w-4 text-white" />
          <span className="text-white">Înapoi la login</span>
        </Link>

        {!success ? (
          <button
            type="submit"
            disabled={loading}
            className="inline-flex h-11 min-w-[170px] items-center justify-center gap-2 rounded-xl bg-black px-4 text-sm font-semibold text-white shadow-sm transition-all duration-200 hover:bg-slate-800 hover:shadow-md disabled:cursor-not-allowed disabled:opacity-60"
          >
            {role === "mechanic" ? (
              <Wrench className="h-4 w-4" />
            ) : (
              <UserPlus className="h-4 w-4" />
            )}
            {loading ? "Se creează..." : submitLabel}
          </button>
        ) : null}
      </div>
    </form>
  );
}