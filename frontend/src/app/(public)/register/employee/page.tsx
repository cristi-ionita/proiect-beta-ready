"use client";

import AuthPageShell from "@/components/auth/auth-page-shell";
import RegisterForm from "@/components/auth/register-form";

export default function EmployeeRegisterPage() {
  return (
    <AuthPageShell>
      <RegisterForm
        role="employee"
        submitLabel="Creează cont"
        successMessage="Cererea pentru cont de angajat a fost trimisă. Verifică emailul pentru confirmare."
      />
    </AuthPageShell>
  );
}