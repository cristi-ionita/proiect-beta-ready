"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, MailQuestion, Send } from "lucide-react";

import AuthPageShell from "@/components/auth/auth-page-shell";
import { useI18n } from "@/lib/i18n/use-i18n";
import { authMessages } from "@/lib/i18n/auth-messages";
import { forgotPassword } from "@/services/auth.api";

export default function ForgotPasswordPage() {
  const { locale } = useI18n();
  const safeLocale =
    locale === "ro" || locale === "en" || locale === "de" ? locale : "de";
  const text = authMessages[safeLocale];

  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const normalizedEmail = email.trim().toLowerCase();

    if (!normalizedEmail) {
      setError(text.emailRequired);
      setSuccess("");
      return;
    }

    try {
      setLoading(true);
      setError("");
      setSuccess("");

      await forgotPassword(normalizedEmail);
      setSuccess(text.forgotPasswordSuccess);
      setEmail("");
    } catch {
      setError(text.forgotPasswordError);
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthPageShell
      icon={<MailQuestion className="h-7 w-7" />}
      title={text.forgotPasswordTitle}
    >
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-md rounded-[28px] border border-white/10 bg-white/95 p-5 shadow-[0_22px_60px_rgba(0,0,0,0.28)] backdrop-blur-xl"
      >
        <p className="mb-5 text-center text-sm leading-6 text-slate-600">
          {text.forgotPasswordDescription}
        </p>

        <input
          type="email"
          placeholder={text.email}
          value={email}
          onChange={(event) => {
            setEmail(event.target.value);
            if (error) setError("");
          }}
          autoComplete="email"
          autoCapitalize="none"
          autoCorrect="off"
          spellCheck={false}
          className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition-all duration-200 placeholder:text-slate-400 focus:border-slate-300 focus:ring-2 focus:ring-slate-200"
        />

        {error ? (
          <div
            className="mt-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-600"
            role="alert"
            aria-live="polite"
          >
            {error}
          </div>
        ) : null}

        {success ? (
          <div
            className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700"
            role="status"
            aria-live="polite"
          >
            {success}
          </div>
        ) : null}

        <div className="mt-5 flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
          <Link
            href="/"
            className="inline-flex h-11 min-w-[150px] items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-800 shadow-sm transition-all duration-200 hover:bg-slate-50 hover:shadow-md"
          >
            <ArrowLeft className="h-4 w-4" />
            {text.back}
          </Link>

          <button
            type="submit"
            disabled={loading || !email.trim()}
            className="inline-flex h-11 min-w-[150px] items-center justify-center gap-2 rounded-2xl bg-blue-600 px-4 text-sm font-semibold text-white shadow-sm transition-all duration-200 hover:bg-blue-700 hover:shadow-md disabled:cursor-not-allowed disabled:opacity-60"
          >
            <Send className="h-4 w-4" />
            {loading ? text.sending : text.sendResetLink}
          </button>
        </div>
      </form>
    </AuthPageShell>
  );
}