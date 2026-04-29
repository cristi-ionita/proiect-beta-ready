"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { ArrowLeft, MailQuestion, Send } from "lucide-react";

import AuthPageShell from "@/components/auth/auth-page-shell";
import Alert from "@/components/ui/alert";
import Button from "@/components/ui/button";
import FormField from "@/components/ui/form-field";
import Input from "@/components/ui/input";
import { authMessages } from "@/lib/i18n/auth-messages";
import { useI18n } from "@/lib/i18n/use-i18n";
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

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
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
        className="w-full max-w-[640px] rounded-[26px] border border-white/10 bg-white/10 p-5 backdrop-blur-md"
      >
        <p className="mb-5 text-center text-sm leading-6 text-slate-300">
          {text.forgotPasswordDescription}
        </p>

        <FormField label={text.email} required>
          <Input
            type="email"
            value={email}
            onChange={(event) => {
              setEmail(event.target.value);

              if (error) setError("");
              if (success) setSuccess("");
            }}
            autoComplete="email"
            autoCapitalize="none"
            autoCorrect="off"
            spellCheck={false}
            placeholder={text.email}
          />
        </FormField>

        {error ? (
          <Alert className="mt-4" variant="error" message={error} />
        ) : null}

        {success ? (
          <Alert className="mt-4" variant="success" message={success} />
        ) : null}

        <div className="mt-5 flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
          <Link href="/">
            <Button type="button" variant="secondary">
              <ArrowLeft className="h-4 w-4" />
              {text.backToLogin}
            </Button>
          </Link>

          <Button type="submit" loading={loading} disabled={loading || !email.trim()}>
            <Send className="h-4 w-4" />
            {loading ? text.sending : text.sendResetLink}
          </Button>
        </div>
      </form>
    </AuthPageShell>
  );
}