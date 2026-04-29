"use client";

import Link from "next/link";
import type { FormEvent } from "react";
import { Eye, EyeOff } from "lucide-react";

import Alert from "@/components/ui/alert";
import Button from "@/components/ui/button";
import Input from "@/components/ui/input";

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
      className="mx-auto max-w-sm rounded-[26px] border border-white/10 bg-white/10 p-5 backdrop-blur-md"
    >
      <div className="mb-5 flex items-center justify-end">
        <Button
          type="button"
          variant="back"
          size="sm"
          onClick={handleBack}
          disabled={loading}
        >
          {text.back}
        </Button>
      </div>

      <div className="space-y-3">
        <Input
          type="text"
          value={identifier}
          onChange={(event) => setIdentifier(event.target.value)}
          placeholder={text.username}
          autoComplete="username"
        />

        <div className="relative">
          <Input
            type={showSecret ? "text" : "password"}
            value={secret}
            onChange={(event) => setSecret(event.target.value)}
            placeholder={text.password}
            autoComplete="current-password"
            className="pr-12"
          />

          <button
            type="button"
            onClick={toggleShowSecret}
            aria-label={text.toggleSecret}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-300 hover:text-white"
          >
            {showSecret ? (
              <EyeOff className="h-4 w-4" />
            ) : (
              <Eye className="h-4 w-4" />
            )}
          </button>
        </div>
      </div>

      {role !== "admin" && (
        <div className="mt-4 flex flex-col gap-2 text-sm sm:flex-row sm:items-center sm:justify-between">
          <Link
            href="/auth/forgot-password"
            className="text-slate-300 hover:text-white"
          >
            {text.forgotPassword}
          </Link>

          {role === "employee" && (
            <Link
              href="/register/employee"
              className="text-slate-300 hover:text-white"
            >
              {text.createEmployeeAccount}
            </Link>
          )}

          {role === "mechanic" && (
            <Link
              href="/register/mechanic"
              className="text-slate-300 hover:text-white"
            >
              {text.createMechanicAccount}
            </Link>
          )}
        </div>
      )}

      {error ? <Alert className="mt-4" variant="error" message={error} /> : null}

      <Button
        type="submit"
        className="mt-4 w-full"
        disabled={loading || !normalizedIdentifier || !normalizedSecret}
        loading={loading}
      >
        {text.login}
      </Button>
    </form>
  );
}