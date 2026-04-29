"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  CheckCircle2,
  CircleAlert,
  Loader2,
  MailCheck,
  Send,
} from "lucide-react";

import AuthPageShell from "@/components/auth/auth-page-shell";
import Alert from "@/components/ui/alert";
import Button from "@/components/ui/button";
import Input from "@/components/ui/input";
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

function getErrorMessage(error: unknown, fallback: string): string {
  if (
    typeof error === "object" &&
    error !== null &&
    "message" in error &&
    typeof (error as { message?: unknown }).message === "string"
  ) {
    return (error as { message: string }).message;
  }

  return fallback;
}

function VerifyEmailFallback() {
  return (
    <AuthPageShell
      icon={<MailCheck className="h-7 w-7" />}
      title="Verificare email"
    >
      <div className="mx-auto max-w-md rounded-2xl border border-white/10 bg-white/10 p-6 text-center backdrop-blur-md">
        <Loader2 className="mx-auto h-10 w-10 animate-spin text-white" />
        <p className="mt-4 text-sm font-semibold text-white">
          Se verifică adresa de email...
        </p>
      </div>
    </AuthPageShell>
  );
}

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const token = useMemo(
    () => searchParams.get("token")?.trim() || "",
    [searchParams]
  );

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
      } catch (error: unknown) {
        setStatus("error");
        setMessage(
          getErrorMessage(
            error,
            "Nu am putut verifica emailul. Linkul poate fi invalid sau expirat."
          )
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
        { email: normalizedEmail }
      );

      setResendMessage(
        data.message || "Emailul de verificare a fost retrimis cu succes."
      );
    } catch (error: unknown) {
      setResendError(
        getErrorMessage(error, "Nu s-a putut retrimite emailul de verificare.")
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
      <div className="mx-auto max-w-md rounded-2xl border border-white/10 bg-white/10 p-6 backdrop-blur-md">
        {status === "loading" && (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <Loader2 className="h-14 w-14 animate-spin text-white" />
            <p className="mt-4 text-base font-semibold text-white">
              {message}
            </p>
          </div>
        )}

        {status === "success" && (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <CheckCircle2 className="h-16 w-16 text-emerald-300" />
            <p className="mt-4 text-base font-semibold text-white">
              {message}
            </p>
            <p className="mt-2 text-sm text-slate-300">
              Adresa de email a fost confirmată. Administratorul poate aproba
              acum contul tău.
            </p>

            <div className="mt-6">
              <Button onClick={() => router.push("/")}>Mergi la login</Button>
            </div>
          </div>
        )}

        {status === "error" && (
          <div className="py-2">
            <div className="flex flex-col items-center justify-center text-center">
              <CircleAlert className="h-16 w-16 text-rose-300" />
              <p className="mt-4 text-base font-semibold text-white">
                Verificarea a eșuat
              </p>
              <p className="mt-2 text-sm text-slate-300">{message}</p>
            </div>

            <div className="mt-8 rounded-2xl border border-white/10 bg-white/10 p-4">
              <p className="text-sm font-semibold text-white">
                Retrimite emailul de verificare
              </p>
              <p className="mt-1 text-xs text-slate-400">
                Introdu adresa de email folosită la înregistrare.
              </p>

              <div className="mt-4 flex gap-2">
                <Input
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
                />

                <Button
                  type="button"
                  onClick={() => void handleResend()}
                  disabled={resendLoading}
                  loading={resendLoading}
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>

              {resendMessage && (
                <Alert
                  variant="success"
                  message={resendMessage}
                  className="mt-3"
                />
              )}

              {resendError && (
                <Alert
                  variant="error"
                  message={resendError}
                  className="mt-3"
                />
              )}
            </div>

            <div className="mt-6 flex justify-center">
              <Button variant="secondary" onClick={() => router.push("/")}>
                Înapoi la login
              </Button>
            </div>
          </div>
        )}
      </div>
    </AuthPageShell>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={<VerifyEmailFallback />}>
      <VerifyEmailContent />
    </Suspense>
  );
}