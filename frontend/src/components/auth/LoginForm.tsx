"use client";

import Link from "next/link";
import type { FormEvent } from "react";
import { Eye, EyeOff } from "lucide-react";

type LoginRole = "admin" | "employee" | "mechanic";

type LoginFormText = {
  back: string;
  forgotPassword: string;
  login: string;
  toggleSecret: string;
  username: string;
  password: string;
  createEmployeeAccount: string;
  createMechanicAccount: string;
};

type LoginFormProps = {
  role: LoginRole;
  identifier: string;
  secret: string;
  showSecret: boolean;
  error: string;
  loading: boolean;
  text: LoginFormText;
  normalizedIdentifier: string;
  normalizedSecret: string;
  setIdentifier: (value: string) => void;
  setSecret: (value: string) => void;
  toggleShowSecret: () => void;
  handleBack: () => void;
  handleSubmit: (event: FormEvent<HTMLFormElement>) => void;
};

export default function LoginForm({
  role,
  identifier,
  secret,
  showSecret,
  error,
  loading,
  text,
  normalizedIdentifier,
  normalizedSecret,
  setIdentifier,
  setSecret,
  toggleShowSecret,
  handleBack,
  handleSubmit,
}: LoginFormProps) {
  return (
    <form
      onSubmit={handleSubmit}
      className="mx-auto max-w-sm rounded-[26px] border border-white/10 bg-gradient-to-b from-white to-slate-50 p-5 shadow-[0_20px_56px_rgba(0,0,0,0.24)] backdrop-blur-xl"
    >
      <div className="mb-5 flex items-center justify-end">
        <button
          type="button"
          onClick={handleBack}
          disabled={loading}
          className="inline-flex items-center justify-center rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow-[0_6px_16px_rgba(0,0,0,0.25)] transition-all duration-200 hover:bg-slate-800 hover:shadow-[0_10px_24px_rgba(0,0,0,0.35)] active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-50"
        >
          {text.back}
        </button>
      </div>

      <div className="mb-3">
        <input
          type="text"
          value={identifier}
          onChange={(event) => setIdentifier(event.target.value)}
          placeholder={text.username}
          autoComplete="username"
          autoCapitalize="none"
          autoCorrect="off"
          spellCheck={false}
          className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition-all duration-200 focus:border-slate-300 focus:ring-2 focus:ring-slate-200"
        />
      </div>

      <div className="relative mb-3">
        <input
          type={showSecret ? "text" : "password"}
          value={secret}
          onChange={(event) => setSecret(event.target.value)}
          placeholder={text.password}
          autoComplete="current-password"
          className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 pr-12 text-sm text-slate-900 outline-none transition-all duration-200 focus:border-slate-300 focus:ring-2 focus:ring-slate-200"
        />

        <button
          type="button"
          onClick={toggleShowSecret}
          className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md p-1 text-slate-500 transition-all duration-200 hover:bg-slate-100 hover:text-slate-900 active:scale-95"
          aria-label={text.toggleSecret}
        >
          {showSecret ? (
            <EyeOff className="h-[18px] w-[18px]" />
          ) : (
            <Eye className="h-[18px] w-[18px]" />
          )}
        </button>
      </div>

      {role === "employee" ? (
        <div className="mb-4 flex items-center justify-between gap-3">
          <Link
            href="/auth/forgot-password"
            className="text-sm font-medium text-slate-600 transition-colors hover:text-slate-900"
          >
            {text.forgotPassword}
          </Link>

          <Link
            href="/register/employee"
            className="text-sm font-medium text-slate-600 transition-colors hover:text-slate-900"
          >
            {text.createEmployeeAccount}
          </Link>
        </div>
      ) : null}

      {role === "mechanic" ? (
        <div className="mb-4 flex items-center justify-end">
          <Link
            href="/register/mechanic"
            className="text-sm font-medium text-slate-600 transition-colors hover:text-slate-900"
          >
            {text.createMechanicAccount}
          </Link>
        </div>
      ) : null}

      {error ? (
        <div
          className="mb-3 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-600"
          role="alert"
          aria-live="polite"
        >
          {error}
        </div>
      ) : null}

      <button
        type="submit"
        disabled={loading || !normalizedIdentifier || !normalizedSecret}
        className="w-full rounded-2xl bg-black py-3 text-sm font-semibold text-white shadow-sm transition-all duration-200 hover:bg-slate-800 hover:shadow-md disabled:cursor-not-allowed disabled:opacity-60"
      >
        {loading ? "..." : text.login}
      </button>
    </form>
  );
}