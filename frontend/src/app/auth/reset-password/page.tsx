"use client";

import { Suspense, useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { KeyRound, Save } from "lucide-react";

import AuthPageShell from "@/components/auth/auth-page-shell";
import PasswordField from "@/components/auth/PasswordField";
import Alert from "@/components/ui/alert";
import Button from "@/components/ui/button";
import { resetPassword } from "@/services/auth.api";

function ResetPasswordContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const token = searchParams.get("token") ?? "";

  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const normalizedPassword = password.trim();

    if (!token) {
      setError("Reset token is missing.");
      setSuccess("");
      return;
    }

    if (normalizedPassword.length < 8) {
      setError("Password must have at least 8 characters.");
      setSuccess("");
      return;
    }

    try {
      setLoading(true);
      setError("");
      setSuccess("");

      const response = await resetPassword(token, normalizedPassword);
      setSuccess(response.message);
      setPassword("");

      window.setTimeout(() => {
        router.push("/");
      }, 2000);
    } catch {
      setError("Could not reset password. The link may be invalid or expired.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthPageShell icon={<KeyRound className="h-7 w-7" />} title="Reset password">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-[640px] rounded-[26px] border border-white/10 bg-white/10 p-5 backdrop-blur-md"
      >
        <p className="mb-5 text-center text-sm leading-6 text-slate-300">
          Enter your new password. It must have at least 8 characters.
        </p>

        <PasswordField
          label="New password"
          value={password}
          onChange={(value) => {
            setPassword(value);

            if (error) setError("");
            if (success) setSuccess("");
          }}
          show={showPassword}
          onToggle={() => setShowPassword((prev) => !prev)}
          placeholder="New password"
        />

        {error ? (
          <Alert className="mt-4" variant="error" message={error} />
        ) : null}

        {success ? (
          <Alert className="mt-4" variant="success" message={success} />
        ) : null}

        <div className="mt-5 flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
          <Link href="/">
            <Button type="button" variant="secondary">
              Back to login
            </Button>
          </Link>

          <Button
            type="submit"
            loading={loading}
            disabled={loading || password.trim().length < 8}
          >
            <Save className="h-4 w-4" />
            {loading ? "Resetting..." : "Reset password"}
          </Button>
        </div>
      </form>
    </AuthPageShell>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={null}>
      <ResetPasswordContent />
    </Suspense>
  );
}