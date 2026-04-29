"use client";

import { type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, TriangleAlert } from "lucide-react";

import CardShell from "@/components/patterns/card-shell";
import DataStateBoundary from "@/components/patterns/data-state-boundary";
import StatCard from "@/components/patterns/stat-card";
import { useEmployeeDashboard } from "@/hooks/dashboard/use-employee-dashboard";
import { useSafeI18n } from "@/hooks/use-safe-i18n";

type Accent = "rose" | "emerald";

type EmployeeCardConfig = {
  key: string;
  title: string;
  icon: ReactNode;
  accent: Accent;
  href: string;
};

export default function EmployeeDashboardScreen() {
  const router = useRouter();
  const { t } = useSafeI18n();
  const { loading, error } = useEmployeeDashboard();

  const cards: EmployeeCardConfig[] = [
    {
      key: "approveVehicle",
      title: t("vehicles", "detailsTitle"),
      icon: <CheckCircle2 className="h-6 w-6" />,
      accent: "emerald",
      href: "/employee/my-vehicle/check-vehicle?from=dashboard",
    },
    {
      key: "reportIssue",
      title: t("issues", "reportIssue"),
      icon: <TriangleAlert className="h-6 w-6" />,
      accent: "rose",
      href: "/employee/issues/report?from=dashboard",
    },
  ];

  return (
    <DataStateBoundary
      isLoading={loading}
      isError={Boolean(error)}
      errorMessage={error ?? t("dashboard", "failedToLoadDashboard")}
    >
      <section className="grid gap-5 sm:grid-cols-2">
        {cards.map((card) => (
          <CardShell key={card.key} accent={card.accent}>
            <StatCard
              title={card.title}
              icon={card.icon}
              onClick={() => router.push(card.href)}
            />
          </CardShell>
        ))}
      </section>
    </DataStateBoundary>
  );
}