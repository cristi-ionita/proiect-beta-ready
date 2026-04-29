"use client";

import { useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, CalendarDays, CarFront, TriangleAlert } from "lucide-react";

import DataStateBoundary from "@/components/patterns/data-state-boundary";
import ListChip from "@/components/patterns/list-chip";
import ListRow from "@/components/patterns/list-row";
import Button from "@/components/ui/button";
import SectionCard from "@/components/ui/section-card";
import StatusBadge from "@/components/ui/status-badge";
import { useAdminIssues } from "@/hooks/admin/use-admin-issues";
import { useSafeI18n } from "@/hooks/use-safe-i18n";
import {
  getIssueStatusLabel,
  getIssueStatusVariant,
} from "@/lib/status/issue-status";
import { formatDate } from "@/lib/utils";
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

export default function AdminIssuesScreen() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { t, localeTag } = useSafeI18n();

  const showBackButton = searchParams.get("from") === "dashboard";
  const { issues, loading, error } = useAdminIssues();

  const sortedIssues = useMemo(() => {
    return [...issues]
      .filter((issue) => issue.status === "open")
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
          <ArrowLeft className="h-4 w-4" />
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
            {sortedIssues.map((issue: IssueItem) => (
              <ListRow
                key={issue.id}
                leading={<TriangleAlert className="h-4 w-4" />}
                title={issue.vehicle_license_plate || "—"}
                badge={
                  <StatusBadge
                    label={getIssueStatusLabel(issue.status)}
                    variant={getIssueStatusVariant(issue.status)}
                  />
                }
                meta={
                  <>
                    <ListChip icon={<CarFront className="h-3 w-3" />} variant="blue">
                      {issue.vehicle_license_plate || "—"}
                    </ListChip>

                    <ListChip icon={<CalendarDays className="h-3 w-3" />}>
                      {formatDate(issue.created_at, localeTag)}
                    </ListChip>

                    <StatusBadge
                      label={getPriorityLabel(issue.priority)}
                      variant={getPriorityVariant(issue.priority)}
                      size="sm"
                    />
                  </>
                }
                onClick={() => router.push(`/admin/issues/${issue.id}`)}
              />
            ))}
          </div>
        </DataStateBoundary>
      </SectionCard>
    </div>
  );
}