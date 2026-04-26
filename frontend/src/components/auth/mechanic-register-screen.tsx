"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { ArrowLeft, CheckCircle, Eye, EyeOff, Wrench } from "lucide-react";

import Button from "@/components/ui/button";
import FormField from "@/components/ui/form-field";
import Input from "@/components/ui/input";
import Card from "@/components/ui/card";
import { register } from "@/services/auth.api";
import { isApiClientError } from "@/lib/api-error";

export default function MechanicRegisterPage() {
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
        role: "mechanic",
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
    <main className="flex min-h-screen items-center justify-center bg-[radial-gradient(circle_at_top,#334155_0%,#1e293b_42%,#0f172a_100%)] px-4 py-8">
      <div className="w-full max-w-xl">
        <div className="mb-8 flex flex-col items-center justify-center text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-[22px] border border-white/10 bg-white/10 text-white shadow-[0_14px_30px_rgba(0,0,0,0.25)] backdrop-blur-md">
            <Wrench className="h-7 w-7" />
          </div>

          <h1 className="mt-4 text-[32px] font-semibold tracking-tight text-white">
            Creează cont mecanic
          </h1>
        </div>

        <Card className="p-6">
          <form onSubmit={handleSubmit}>
            {!success ? (
              <div className="grid gap-4 md:grid-cols-2">
                <FormField label="Prenume" required>
                  <Input
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                  />
                </FormField>

                <FormField label="Nume" required>
                  <Input
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                  />
                </FormField>

                <div className="md:col-span-2">
                  <FormField label="Username" required>
                    <Input
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                    />
                  </FormField>
                </div>

                <div className="md:col-span-2">
                  <FormField label="Email" required>
                    <Input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                  </FormField>
                </div>

                <PasswordField
                  label="Parolă"
                  value={password}
                  visible={showPassword}
                  onToggleVisibility={() =>
                    setShowPassword((prev) => !prev)
                  }
                  onChange={setPassword}
                />

                <PasswordField
                  label="Confirmă parola"
                  value={confirmPassword}
                  visible={showConfirmPassword}
                  onToggleVisibility={() =>
                    setShowConfirmPassword((prev) => !prev)
                  }
                  onChange={setConfirmPassword}
                />
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <CheckCircle className="h-16 w-16 text-green-500" />
                <p className="mt-4 text-base font-semibold text-white">
                  Cererea pentru cont de mecanic a fost trimisă. Verifică emailul pentru confirmare.
                </p>
              </div>
            )}

            {error && (
              <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-600">
                {error}
              </div>
            )}

            <div className="mt-6 flex items-center justify-between gap-3">
              <Link
                href="/"
                className="inline-flex min-w-[180px] items-center justify-center gap-2 rounded-2xl bg-black px-5 py-3 text-sm font-semibold text-white"
              >
                <ArrowLeft className="h-4 w-4" />
                Înapoi la login
              </Link>

              {!success && (
                <Button type="submit" disabled={loading} loading={loading}>
                  Creează cont mecanic
                </Button>
              )}
            </div>
          </form>
        </Card>
      </div>
    </main>
  );
}

function PasswordField({
  label,
  value,
  visible,
  onToggleVisibility,
  onChange,
}: {
  label: string;
  value: string;
  visible: boolean;
  onToggleVisibility: () => void;
  onChange: (value: string) => void;
}) {
  return (
    <FormField label={label} required>
      <div className="relative">
        <Input
          type={visible ? "text" : "password"}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="pr-12"
        />

        <button
          type="button"
          onClick={onToggleVisibility}
          className="absolute right-3 top-1/2 -translate-y-1/2"
        >
          {visible ? <EyeOff /> : <Eye />}
        </button>
      </div>
    </FormField>
  );
}