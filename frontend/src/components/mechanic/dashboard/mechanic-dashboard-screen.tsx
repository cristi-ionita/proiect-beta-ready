"use client";

import { useMemo, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { CalendarClock, History, TriangleAlert } from "lucide-react";

import CardShell from "@/components/patterns/card-shell";
import DataStateBoundary from "@/components/patterns/data-state-boundary";
import StatCard from "@/components/patterns/stat-card";
import { useMechanicIssues } from "@/hooks/issues/use-mechanic-issues";
import { useSafeI18n } from "@/hooks/use-safe-i18n";

type Accent = "blue" | "violet" | "rose" | "emerald";

type MechanicDashboardCardKey =
  | "problems"
  | "scheduledIssues"
  | "historyIssues";

type MechanicDashboardCardConfig = {
  key: MechanicDashboardCardKey;
  title: string;
  icon: ReactNode;
  accent: Accent;
  href: string;
};

const DASHBOARD_CARDS: MechanicDashboardCardConfig[] = [
  {
    key: "problems",
    title: "Probleme",
    icon: <TriangleAlert className="h-6 w-6" />,
    accent: "rose",
    href: "/mechanic/issues?filter=problems&from=dashboard",
  },
  {
    key: "scheduledIssues",
    title: "Programări",
    icon: <CalendarClock className="h-6 w-6" />,
    accent: "blue",
    href: "/mechanic/issues?filter=scheduled&from=dashboard",
  },
  {
    key: "historyIssues",
    title: "Istoric",
    icon: <History className="h-6 w-6" />,
    accent: "violet",
    href: "/mechanic/issues?filter=history&from=dashboard",
  },
];

function normalizeStatus(status?: string | null): string {
  return String(status ?? "").trim().toLowerCase();
}

export default function MechanicDashboardScreen() {
  const router = useRouter();
  const { t } = useSafeI18n();
  const { issues, loading, error } = useMechanicIssues();

  const safeCounts = useMemo(() => {
    const problems = issues.filter((issue) => {
      const status = normalizeStatus(issue.status);
      return status === "open" || status === "in_progress";
    }).length;

    const scheduledIssues = issues.filter(
      (issue) => normalizeStatus(issue.status) === "scheduled"
    ).length;

    const historyIssues = issues.filter(
      (issue) => normalizeStatus(issue.status) === "resolved"
    ).length;

    return {
      problems,
      scheduledIssues,
      historyIssues,
    };
  }, [issues]);

  return (
    <DataStateBoundary
      isLoading={loading}
      isError={Boolean(error)}
      errorMessage={error ?? t("issues", "failedToLoad")}
    >
      <section className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
        {DASHBOARD_CARDS.map((card) => (
          <CardShell key={card.key} accent={card.accent}>
            <StatCard
              title={card.title}
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