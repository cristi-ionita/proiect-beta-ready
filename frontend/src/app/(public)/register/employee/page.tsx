"use client";

import { UserPlus } from "lucide-react";

import AuthPageShell from "@/components/auth/auth-page-shell";
import RegisterForm from "@/components/auth/register-form";
import { useI18n } from "@/lib/i18n/use-i18n";

export default function EmployeeRegisterPage() {
  const { t } = useI18n();

  return (
    <AuthPageShell
      icon={<UserPlus className="h-7 w-7" />}
      title={t("common", "createEmployeeAccount")}
    >
      <RegisterForm role="employee" />
    </AuthPageShell>
  );
}