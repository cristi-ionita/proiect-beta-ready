"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  CheckCircle2,
  CircleAlert,
  Loader2,
  MailCheck,
  Send,
} from "lucide-react";

import AuthPageShell from "@/components/auth/auth-page-shell";
import Button from "@/components/ui/button";
import { api } from "@/lib/axios";

type VerifyStatus = "loading" | "success" | "error";

type VerifyEmailResponse = {
  success: boolean;
  message: string;
};

type ResendVerificationResponse = {
  success: boolean;
  message: string;
};

export default function VerifyEmailPage() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const token = useMemo(() => searchParams.get("token")?.trim() || "", [searchParams]);

  const [status, setStatus] = useState<VerifyStatus>("loading");
  const [message, setMessage] = useState("Se verifică adresa de email...");
  const [email, setEmail] = useState("");
  const [resendLoading, setResendLoading] = useState(false);
  const [resendMessage, setResendMessage] = useState("");
  const [resendError, setResendError] = useState("");

  useEffect(() => {
    async function verifyEmail() {
      if (!token) {
        setStatus("error");
        setMessage(
          "Lipsește tokenul din linkul de verificare. Deschide linkul complet primit pe email sau retrimite emailul de confirmare."
        );
        return;
      }

      try {
        const { data } = await api.post<VerifyEmailResponse>(
          "/auth/verify-email",
          { token }
        );

        setStatus("success");
        setMessage(data.message || "Email verificat cu succes.");
      } catch (error: any) {
        setStatus("error");
        setMessage(
          error?.response?.data?.detail ||
            "Nu am putut verifica emailul. Linkul poate fi invalid sau expirat."
        );
      }
    }

    void verifyEmail();
  }, [token]);

  async function handleResend() {
    const normalizedEmail = email.trim().toLowerCase();

    if (!normalizedEmail) {
      setResendError("Introdu adresa de email.");
      setResendMessage("");
      return;
    }

    try {
      setResendLoading(true);
      setResendError("");
      setResendMessage("");

      const { data } = await api.post<ResendVerificationResponse>(
        "/auth/resend-verification-email",
        {
          email: normalizedEmail,
        }
      );

      setResendMessage(
        data.message || "Emailul de verificare a fost retrimis cu succes."
      );
    } catch (error: any) {
      setResendError(
        error?.response?.data?.detail ||
          "Nu s-a putut retrimite emailul de verificare."
      );
    } finally {
      setResendLoading(false);
    }
  }

  return (
    <AuthPageShell
      icon={<MailCheck className="h-7 w-7" />}
      title="Verificare email"
    >
      <div className="mx-auto max-w-md rounded-[28px] border border-white/10 bg-gradient-to-b from-white to-slate-50 p-6 shadow-[0_24px_70px_rgba(0,0,0,0.28)] backdrop-blur-xl">
        {status === "loading" ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <Loader2 className="h-14 w-14 animate-spin text-slate-500" />
            <p className="mt-4 text-base font-semibold text-slate-800">
              {message}
            </p>
          </div>
        ) : null}

        {status === "success" ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <CheckCircle2 className="h-16 w-16 text-green-500" />
            <p className="mt-4 text-base font-semibold text-slate-800">
              {message}
            </p>
            <p className="mt-2 text-sm text-slate-600">
              Adresa de email a fost confirmată. Administratorul poate aproba
              acum contul tău.
            </p>

            <div className="mt-6">
              <Button
                onClick={() => router.push("/")}
                className="rounded-2xl"
              >
                Mergi la login
              </Button>
            </div>
          </div>
        ) : null}

        {status === "error" ? (
          <div className="py-2">
            <div className="flex flex-col items-center justify-center text-center">
              <CircleAlert className="h-16 w-16 text-red-500" />
              <p className="mt-4 text-base font-semibold text-slate-800">
                Verificarea a eșuat
              </p>
              <p className="mt-2 text-sm text-slate-600">{message}</p>
            </div>

            <div className="mt-8 rounded-2xl border border-slate-200 bg-white p-4">
              <p className="text-sm font-semibold text-slate-800">
                Retrimite emailul de verificare
              </p>
              <p className="mt-1 text-xs text-slate-500">
                Introdu adresa de email folosită la înregistrare.
              </p>

              <div className="mt-4 flex gap-2">
                <input
                  type="email"
                  placeholder="Email"
                  value={email}
                  onChange={(event) => {
                    setEmail(event.target.value);
                    if (resendError) setResendError("");
                  }}
                  autoComplete="email"
                  autoCapitalize="none"
                  autoCorrect="off"
                  spellCheck={false}
                  className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition-all duration-200 focus:border-slate-300 focus:ring-2 focus:ring-slate-200"
                />

                <Button
                  type="button"
                  onClick={() => void handleResend()}
                  disabled={resendLoading}
                  className="rounded-2xl px-4"
                >
                  {resendLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                </Button>
              </div>

              {resendMessage ? (
                <div
                  className="mt-3 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700"
                  role="status"
                  aria-live="polite"
                >
                  {resendMessage}
                </div>
              ) : null}

              {resendError ? (
                <div
                  className="mt-3 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-600"
                  role="alert"
                  aria-live="polite"
                >
                  {resendError}
                </div>
              ) : null}
            </div>

            <div className="mt-6 flex justify-center">
              <Link href="/">
                <Button variant="secondary" className="rounded-2xl">
                  Înapoi la login
                </Button>
              </Link>
            </div>
          </div>
        ) : null}
      </div>
    </AuthPageShell>
  );
}