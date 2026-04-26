"use client";

import { KeyRound } from "lucide-react";

import LoginForm from "@/components/auth/LoginForm";
import RoleSelector from "@/components/auth/RoleSelector";
import LanguageSwitcher from "@/components/shared/language-switcher";
import { useLoginPage } from "@/hooks/auth/use-login-page";

function LoginPageShell({ children }: { children: React.ReactNode }) {
  return (
    <main className="relative flex min-h-screen items-center justify-center bg-[radial-gradient(circle_at_top,#334155_0%,#1e293b_42%,#0f172a_100%)] px-4 py-8">
      {/* Language switcher */}
      <div className="absolute right-4 top-4 sm:right-6 sm:top-6">
        <LanguageSwitcher variant="dark" align="right" />
      </div>

      <div className="w-full max-w-4xl">{children}</div>
    </main>
  );
}

function LoginPageHeader({ title }: { title: string }) {
  return (
    <header className="mb-10 flex flex-col items-center justify-center text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-[22px] border border-white/10 bg-white/10 text-white shadow-[0_14px_30px_rgba(0,0,0,0.25)] backdrop-blur-md">
        <KeyRound className="h-7 w-7" />
      </div>

      <h1 className="mt-4 text-[32px] font-semibold tracking-tight text-white">
        {title}
      </h1>
    </header>
  );
}

function LoginPageCheckingState({ label }: { label: string }) {
  return (
    <main className="relative flex min-h-screen items-center justify-center bg-[radial-gradient(circle_at_top,#334155_0%,#1e293b_42%,#0f172a_100%)] px-4">
      {/* Language switcher also visible while loading */}
      <div className="absolute right-4 top-4 sm:right-6 sm:top-6">
        <LanguageSwitcher variant="dark" align="right" />
      </div>

      <div className="rounded-[28px] border border-white/10 bg-white/10 p-6 shadow-[0_20px_50px_rgba(0,0,0,0.28)] backdrop-blur-xl">
        <p className="text-sm font-medium text-slate-200">{label}</p>
      </div>
    </main>
  );
}

export default function LoginPage() {
  const {
    role,
    identifier,
    secret,
    showSecret,
    error,
    loading,
    checking,
    mounted,
    text,
    normalizedIdentifier,
    normalizedSecret,
    setIdentifier,
    setSecret,
    toggleShowSecret,
    handleRoleSelect,
    handleBack,
    handleSubmit,
  } = useLoginPage();

  const isPageReady = mounted && !checking;

  if (!isPageReady) {
    return <LoginPageCheckingState label={text.checking} />;
  }

  return (
    <LoginPageShell>
      <LoginPageHeader title={text.login} />

      {role === null ? (
        <RoleSelector text={text} onSelect={handleRoleSelect} />
      ) : (
        <LoginForm
          role={role}
          identifier={identifier}
          secret={secret}
          showSecret={showSecret}
          error={error}
          loading={loading}
          text={text}
          normalizedIdentifier={normalizedIdentifier}
          normalizedSecret={normalizedSecret}
          setIdentifier={setIdentifier}
          setSecret={setSecret}
          toggleShowSecret={toggleShowSecret}
          handleBack={handleBack}
          handleSubmit={handleSubmit}
        />
      )}
    </LoginPageShell>
  );
}