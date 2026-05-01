"use client";

import { useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { TriangleAlert } from "lucide-react";

import DataStateBoundary from "@/components/patterns/data-state-boundary";
import Button from "@/components/ui/button";
import SectionCard from "@/components/ui/section-card";
import StatusBadge from "@/components/ui/status-badge";
import { useAdminIssues } from "@/hooks/admin/use-admin-issues";
import { useSafeI18n } from "@/hooks/use-safe-i18n";
import type { IssueItem } from "@/types/issue.types";

const priorityOrder: Record<string, number> = {
  critical: 0,
  high: 1,
  medium: 2,
  low: 3,
};

function getPriorityLabel(priority?: string) {
  switch (priority) {
    case "low":
      return "LOW";
    case "medium":
      return "MEDIUM";
    case "high":
      return "HIGH";
    case "critical":
      return "CRITICAL";
    default:
      return "—";
  }
}

function getPriorityVariant(priority?: string) {
  switch (priority) {
    case "low":
      return "neutral";
    case "medium":
      return "info";
    case "high":
      return "warning";
    case "critical":
      return "danger";
    default:
      return "neutral";
  }
}

function formatIssueDate(value?: string | null) {
  if (!value) return { date: "—", time: "—" };

  const parsed = new Date(value);

  if (Number.isNaN(parsed.getTime())) {
    return { date: value, time: "—" };
  }

  return {
    date: new Intl.DateTimeFormat("ro-RO", {
      day: "2-digit",
      month: "short",
    }).format(parsed),
    time: new Intl.DateTimeFormat("ro-RO", {
      hour: "2-digit",
      minute: "2-digit",
    }).format(parsed),
  };
}

export default function AdminIssuesScreen() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { t } = useSafeI18n();

  const showBackButton = searchParams.get("from") === "dashboard";
  const { issues, loading, error } = useAdminIssues();

  const sortedIssues = useMemo(() => {
    return [...issues]
      .filter((issue) => issue.status === "open")
      .filter((issue) => !issue.assigned_mechanic_id)
      .sort((a, b) => {
        const aPriority = priorityOrder[a.priority || "low"] ?? 99;
        const bPriority = priorityOrder[b.priority || "low"] ?? 99;

        return aPriority - bPriority;
      });
  }, [issues]);

  return (
    <div className="space-y-6">
      {showBackButton ? (
        <Button variant="back" onClick={() => router.push("/admin/dashboard")}>
          {t("common", "back")}
        </Button>
      ) : null}

      <SectionCard title={t("issues", "openIssues")}>
        <DataStateBoundary
          isLoading={loading}
          isError={Boolean(error)}
          errorMessage={error ?? t("issues", "failedToLoad")}
          isEmpty={sortedIssues.length === 0}
          emptyTitle={t("issues", "noOpenIssues")}
        >
          <div className="space-y-2.5">
            {sortedIssues.map((issue: IssueItem) => {
              const createdAt = formatIssueDate(issue.created_at);
              const shiftNumber = issue.reported_by_shift_number ?? "—";

              return (
                <button
                  key={issue.id}
                  type="button"
                  onClick={() => router.push(`/admin/issues/${issue.id}`)}
                  className="flex w-full items-center gap-4 rounded-[24px] border border-white/10 bg-white/10 p-4 text-left transition hover:bg-white/15"
                >
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-black text-white">
                    <TriangleAlert className="h-4 w-4" />
                  </div>

                  <div className="flex min-w-0 flex-1 items-center justify-between gap-4">
                    <div className="flex flex-wrap items-center gap-5 text-sm font-semibold">
                      <span className="text-white">
                        {issue.vehicle_license_plate || "—"}
                      </span>

                      <span className="text-slate-200">
                        Tura {shiftNumber}
                      </span>

                      <span className="text-slate-300">{createdAt.date}</span>

                      <span className="text-slate-300">{createdAt.time}</span>
                    </div>

                    <StatusBadge
                      label={getPriorityLabel(issue.priority)}
                      variant={getPriorityVariant(issue.priority)}
                      size="sm"
                    />
                  </div>
                </button>
              );
            })}
          </div>
        </DataStateBoundary>
      </SectionCard>
    </div>
  );
}