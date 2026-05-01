"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import { CheckCircle, MailCheck, UserPlus, Wrench } from "lucide-react";

import PasswordField from "@/components/auth/PasswordField";
import Alert from "@/components/ui/alert";
import Button from "@/components/ui/button";
import FormField from "@/components/ui/form-field";
import Input from "@/components/ui/input";
import { isApiClientError } from "@/lib/api-error";
import { authMessages } from "@/lib/i18n/auth-messages";
import { useI18n } from "@/lib/i18n/use-i18n";
import { register, resendVerificationEmail } from "@/services/auth.api";

type RegisterRole = "employee" | "mechanic";

type RegisterFormProps = {
  role: RegisterRole;
};

export default function RegisterForm({ role }: RegisterFormProps) {
  const { locale } = useI18n();
  const safeLocale =
    locale === "ro" || locale === "en" || locale === "de" ? locale : "de";
  const text = authMessages[safeLocale];

  const successMessage =
    role === "mechanic"
      ? text.mechanicRegisterSuccess
      : text.employeeRegisterSuccess;

  const submitLabel =
    role === "mechanic"
      ? text.createMechanicAccount
      : text.createEmployeeAccount;

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [lastSubmittedEmail, setLastSubmittedEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [error, setError] = useState("");
  const [resendMessage, setResendMessage] = useState("");
  const [showResend, setShowResend] = useState(false);
  const [success, setSuccess] = useState(false);

  function resetResendState() {
    setShowResend(false);
    setResendMessage("");
  }

  async function handleResendVerificationEmail() {
    const targetEmail = (lastSubmittedEmail || email).trim().toLowerCase();

    if (!targetEmail) {
      setError("Introdu emailul pentru retrimiterea confirmării.");
      return;
    }

    try {
      setResendLoading(true);
      setError("");
      setResendMessage("");

      const response = await resendVerificationEmail(targetEmail);

      setResendMessage(
        response.message || "Emailul de confirmare a fost retrimis."
      );
    } catch (err: unknown) {
      setResendMessage("");
      setError(
        isApiClientError(err)
          ? err.message
          : "Nu s-a putut retrimite emailul de confirmare."
      );
    } finally {
      setResendLoading(false);
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const normalizedFirstName = firstName.trim();
    const normalizedLastName = lastName.trim();
    const normalizedUsername = username.trim();
    const normalizedEmail = email.trim().toLowerCase();
    const normalizedPassword = password.trim();
    const normalizedConfirmPassword = confirmPassword.trim();

    resetResendState();

    if (
      !normalizedFirstName ||
      !normalizedLastName ||
      !normalizedUsername ||
      !normalizedEmail ||
      !normalizedPassword ||
      !normalizedConfirmPassword
    ) {
      setError(text.fillAll);
      return;
    }

    if (normalizedUsername.length < 3) {
      setError(text.usernameMin);
      return;
    }

    if (!/^[a-zA-Z0-9._-]+$/.test(normalizedUsername)) {
      setError(text.usernameInvalid);
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
      setLastSubmittedEmail(normalizedEmail);

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
      const message = isApiClientError(err) ? err.message : text.createError;

      setError(message);

      const lowerMessage = message.toLowerCase();

      if (
        lowerMessage.includes("există deja o cerere") ||
        lowerMessage.includes("exista deja o cerere") ||
        lowerMessage.includes("acest email") ||
        lowerMessage.includes("emailul nu este confirmat") ||
        lowerMessage.includes("retrimite") ||
        lowerMessage.includes("verification") ||
        lowerMessage.includes("not confirmed") ||
        lowerMessage.includes("not verified") ||
        lowerMessage.includes("registration request")
      ) {
        setShowResend(true);
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="w-full max-w-[640px] rounded-[26px] border border-white/10 bg-white/10 p-5 backdrop-blur-md"
    >
      {!success ? (
        <div className="grid gap-4 md:grid-cols-2">
          <FormField label={text.firstName} required>
            <Input
              value={firstName}
              onChange={(event) => {
                setFirstName(event.target.value);
                if (error) setError("");
              }}
              autoComplete="given-name"
              placeholder={text.firstName}
            />
          </FormField>

          <FormField label={text.lastName} required>
            <Input
              value={lastName}
              onChange={(event) => {
                setLastName(event.target.value);
                if (error) setError("");
              }}
              autoComplete="family-name"
              placeholder={text.lastName}
            />
          </FormField>

          <div className="md:col-span-2">
            <FormField label={text.username} required>
              <Input
                type="text"
                value={username}
                onChange={(event) => {
                  setUsername(event.target.value);
                  if (error) setError("");
                }}
                autoComplete="username"
                autoCapitalize="none"
                autoCorrect="off"
                spellCheck={false}
                placeholder={text.username}
              />
            </FormField>
          </div>

          <div className="md:col-span-2">
            <FormField label={text.email} required>
              <Input
                type="email"
                value={email}
                onChange={(event) => {
                  setEmail(event.target.value);
                  if (error) setError("");
                  resetResendState();
                }}
                autoComplete="email"
                autoCapitalize="none"
                autoCorrect="off"
                spellCheck={false}
                placeholder="email@example.com"
              />
            </FormField>
          </div>

          <PasswordField
            label={text.password}
            value={password}
            onChange={setPassword}
            show={showPassword}
            onToggle={() => setShowPassword((prev) => !prev)}
          />

          <PasswordField
            label={text.confirmPassword}
            value={confirmPassword}
            onChange={setConfirmPassword}
            show={showConfirmPassword}
            onToggle={() => setShowConfirmPassword((prev) => !prev)}
          />
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-6 text-center">
          <CheckCircle className="h-12 w-12 text-emerald-300" />
          <p className="mt-3 text-sm font-semibold text-white">
            {successMessage}
          </p>
          <p className="mt-2 max-w-md text-sm text-slate-300">
            {text.verifyEmailInfo}
          </p>
        </div>
      )}

      {error ? <Alert className="mt-4" variant="error" message={error} /> : null}

      {showResend && !success ? (
        <div className="mt-4 rounded-2xl border border-white/10 bg-black/20 p-3">
          <Button
            type="button"
            variant="secondary"
            className="w-full"
            loading={resendLoading}
            disabled={resendLoading}
            onClick={handleResendVerificationEmail}
          >
            <MailCheck className="h-4 w-4 shrink-0" />
            Retrimite email confirmare
          </Button>

          {resendMessage ? (
            <p className="mt-2 text-center text-xs font-medium text-emerald-200">
              {resendMessage}
            </p>
          ) : null}
        </div>
      ) : null}

      <div className="mt-5 flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Link href="/">
          <Button type="button" variant="secondary">
            {text.backToLogin}
          </Button>
        </Link>

        {!success ? (
          <Button type="submit" loading={loading} disabled={loading}>
            {role === "mechanic" ? (
              <Wrench className="h-4 w-4 shrink-0" />
            ) : (
              <UserPlus className="h-4 w-4 shrink-0" />
            )}
            {loading ? text.creating : submitLabel}
          </Button>
        ) : null}
      </div>
    </form>
  );
}