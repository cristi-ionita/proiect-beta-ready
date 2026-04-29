"use client";

import { useMemo } from "react";
import type { ReactNode } from "react";
import { useRouter } from "next/navigation";
import {
  CalendarDays,
  CarFront,
  TriangleAlert,
  UserCheck,
  Users,
} from "lucide-react";

import CardShell from "@/components/patterns/card-shell";
import DataStateBoundary from "@/components/patterns/data-state-boundary";
import StatCard from "@/components/patterns/stat-card";
import { useAdminDashboard } from "@/hooks/dashboard/use-admin-dashboard";
import { useSafeI18n } from "@/hooks/use-safe-i18n";
import type { TranslationKey } from "@/lib/i18n/dictionaries";

type Accent = "blue" | "violet" | "rose" | "emerald";

type DashboardCardKey =
  | "activeUsers"
  | "pendingUsers"
  | "availableVehicles"
  | "issues"
  | "todayLeaves";

type DashboardCardConfig = {
  key: DashboardCardKey;
  title: TranslationKey<"dashboard">;
  icon: ReactNode;
  accent: Accent;
  href: string;
};

const DASHBOARD_CARDS: DashboardCardConfig[] = [
  {
    key: "activeUsers",
    title: "activeUsers",
    icon: <Users className="h-6 w-6" />,
    accent: "blue",
    href: "/admin/active-users?from=dashboard",
  },
  {
    key: "pendingUsers",
    title: "pendingUsers",
    icon: <UserCheck className="h-6 w-6" />,
    accent: "emerald",
    href: "/admin/pending-users?from=dashboard",
  },
  {
    key: "availableVehicles",
    title: "availableVehicles",
    icon: <CarFront className="h-6 w-6" />,
    accent: "violet",
    href: "/admin/vehicles/unassigned?from=dashboard",
  },
  {
    key: "issues",
    title: "activeIssues",
    icon: <TriangleAlert className="h-6 w-6" />,
    accent: "rose",
    href: "/admin/issues?from=dashboard",
  },
  {
    key: "todayLeaves",
    title: "todayLeaves",
    icon: <CalendarDays className="h-6 w-6" />,
    accent: "emerald",
    href: "/admin/leave/today?from=dashboard",
  },
];

export default function AdminDashboardScreen() {
  const router = useRouter();
  const { t } = useSafeI18n();
  const { data, loading, error } = useAdminDashboard();

  const safeCounts = useMemo(
    () => ({
      todayLeaves: data?.todayLeaves ?? 0,
      issues: data?.issues?.length ?? 0,
      activeUsers: data?.workingTodayUsers ?? 0,
      pendingUsers: data?.pendingUsers ?? 0,
      availableVehicles: data?.availableVehicles ?? 0,
    }),
    [data]
  );

  return (
    <DataStateBoundary
      isLoading={loading}
      isError={Boolean(error)}
      errorMessage={error ?? t("dashboard", "failedToLoadDashboard")}
    >
      <section className="grid gap-5 sm:grid-cols-2 xl:grid-cols-5">
        {DASHBOARD_CARDS.map((card) => (
          <CardShell key={card.key} accent={card.accent}>
            <StatCard
              title={t("dashboard", card.title)}
              value={safeCounts[card.key]}
              icon={card.icon}
              onClick={() => router.push(card.href)}
            />
          </CardShell>
        ))}
      </section>
    </DataStateBoundary>
  );
}