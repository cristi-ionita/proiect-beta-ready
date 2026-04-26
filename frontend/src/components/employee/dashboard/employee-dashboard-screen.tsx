"use client";

import { type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, TriangleAlert } from "lucide-react";

import CardShell from "@/components/patterns/card-shell";
import DataStateBoundary from "@/components/patterns/data-state-boundary";
import StatCard from "@/components/patterns/stat-card";

import { useEmployeeDashboard } from "@/hooks/dashboard/use-employee-dashboard";
import { useSafeI18n } from "@/hooks/use-safe-i18n";

type Accent = "blue" | "violet" | "rose" | "emerald";

type EmployeeCardConfig = {
  key: string;
  title: string;
  icon: ReactNode;
  accent: Accent;
  href: string;
};

const EMPLOYEE_CARDS: EmployeeCardConfig[] = [
  {
    key: "approveVehicle",
    title: "Aprobă vehicul",
    icon: <CheckCircle2 className="h-6 w-6" />,
    accent: "emerald",
    href: "/employee/my-vehicle/check-vehicle?from=dashboard",
  },
  {
    key: "reportIssue",
    title: "Raportează o problemă",
    icon: <TriangleAlert className="h-6 w-6" />,
    accent: "rose",
    href: "/employee/issues/report?from=dashboard",
  },
];

export default function EmployeeDashboardScreen() {
  const router = useRouter();
  const { t } = useSafeI18n();
  const { loading, error } = useEmployeeDashboard();

  return (
    <DataStateBoundary
      isLoading={loading}
      isError={Boolean(error)}
      errorMessage={error ?? t("dashboard", "failedToLoadDashboard")}
    >
      <div className="space-y-6">
        <section className="grid gap-5 sm:grid-cols-2 xl:grid-cols-2">
          {EMPLOYEE_CARDS.map((card) => (
            <CardShell key={card.key} accent={card.accent}>
              <StatCard
                title={card.title}
                icon={card.icon}
                onClick={() => router.push(card.href)}
              />
            </CardShell>
          ))}
        </section>
      </div>
    </DataStateBoundary>
  );
}