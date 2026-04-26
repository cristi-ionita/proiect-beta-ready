"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import { resetPassword } from "@/services/auth.api";

function ResetPasswordContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const token = searchParams.get("token") ?? "";

  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!token) {
      setError("Reset token is missing.");
      return;
    }

    try {
      setLoading(true);
      setError("");
      setSuccess("");

      const response = await resetPassword(token, password);
      setSuccess(response.message);

      setTimeout(() => {
        router.push("/");
      }, 2000);
    } catch {
      setError("Could not reset password. The link may be invalid or expired.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-[radial-gradient(circle_at_top,#334155_0%,#1e293b_42%,#0f172a_100%)] px-4 py-8">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-sm rounded-[26px] border border-white/10 bg-gradient-to-b from-white to-slate-50 p-5 shadow-[0_20px_56px_rgba(0,0,0,0.24)]"
      >
        <h1 className="mb-5 text-center text-2xl font-semibold text-slate-900">
          Reset password
        </h1>

        <input
          type="password"
          placeholder="New password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          autoComplete="new-password"
          className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition-all duration-200 focus:border-slate-300 focus:ring-2 focus:ring-slate-200"
        />

        {error ? (
          <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-600">
            {error}
          </div>
        ) : null}

        {success ? (
          <div className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">
            {success}
          </div>
        ) : null}

        <button
          type="submit"
          disabled={loading || password.trim().length < 8}
          className="mt-4 w-full rounded-2xl bg-black py-3 text-sm font-semibold text-white shadow-sm transition-all duration-200 hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? "Resetting..." : "Reset password"}
        </button>
      </form>
    </main>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={null}>
      <ResetPasswordContent />
    </Suspense>
  );
}