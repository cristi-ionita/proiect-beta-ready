"use client";

import { UserPlus } from "lucide-react";

import AuthPageShell from "@/components/auth/auth-page-shell";
import RegisterForm from "@/components/auth/register-form";

export default function EmployeeRegisterPage() {
  return (
    <AuthPageShell
      icon={<UserPlus className="h-7 w-7" />}
      title="Creează cont angajat"
    >
      <RegisterForm
        role="employee"
        title="Creează cont angajat"
        submitLabel="Creează cont"
        successMessage="Cererea pentru cont de angajat a fost trimisă. Verifică emailul pentru confirmare, dacă acest flux este activ în backend."
      />
    </AuthPageShell>
  );
}