"use client";

import { useRouter } from "next/navigation";
import {
  AlertTriangle,
  CalendarDays,
  CarFront,
  Clock,
  ClipboardList,
  PlusCircle,
  ShieldAlert,
} from "lucide-react";

import DataStateBoundary from "@/components/patterns/data-state-boundary";
import ListChip from "@/components/patterns/list-chip";
import ListRow from "@/components/patterns/list-row";
import Button from "@/components/ui/button";
import SectionCard from "@/components/ui/section-card";
import StatusBadge from "@/components/ui/status-badge";
import { useMyIssues } from "@/hooks/issues/use-my-issues";
import { useSafeI18n } from "@/hooks/use-safe-i18n";
import type { IssueItem } from "@/types/issue.types";

function formatDateParts(value?: string | null) {
  if (!value) return { date: "—", time: "—" };

  const parsed = new Date(value);

  if (Number.isNaN(parsed.getTime())) {
    return { date: value, time: "—" };
  }

  return {
    date: new Intl.DateTimeFormat("ro-RO", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    }).format(parsed),
    time: new Intl.DateTimeFormat("ro-RO", {
      hour: "2-digit",
      minute: "2-digit",
    }).format(parsed),
  };
}

function getStatusVariant(status: string) {
  if (status === "scheduled") return "info";
  if (status === "in_progress") return "warning";
  if (status === "resolved") return "success";
  if (status === "canceled") return "neutral";

  return "danger";
}

function getStatusLabel(status: string, t: ReturnType<typeof useSafeI18n>["t"]) {
  if (status === "scheduled") return t("issues", "scheduled");
  if (status === "in_progress") return t("issues", "inProgress");
  if (status === "resolved") return t("issues", "resolved");
  if (status === "canceled") return t("issues", "canceled");

  return t("issues", "open");
}

function getReportedItems(issue: IssueItem, t: ReturnType<typeof useSafeI18n>["t"]) {
  const items: string[] = [];

  if (issue.need_brakes) items.push(t("issues", "brakes"));
  if (issue.need_tires) items.push(t("issues", "tires"));
  if (issue.need_oil) items.push(t("issues", "oil"));

  if (issue.need_service_in_km != null) {
    items.push(`${t("issues", "serviceInKm")}: ${issue.need_service_in_km} km`);
  }

  if (issue.dashboard_checks?.trim()) {
    items.push(issue.dashboard_checks.trim());
  }

  if (issue.other_problems?.trim()) {
    items.push(issue.other_problems.trim());
  }

  return items;
}

export default function MyIssuesScreen() {
  const router = useRouter();
  const { t } = useSafeI18n();
  const { data, loading, error } = useMyIssues();

  return (
    <SectionCard
      title={t("issues", "historyTitle")}
      icon={<ClipboardList className="h-5 w-5" />}
      actions={
        <Button
          type="button"
          size="sm"
          onClick={() => router.push("/employee/issues/report?from=issues")}
        >
          <PlusCircle className="h-4 w-4" />
          {t("issues", "reportIssue")}
        </Button>
      }
    >
      <DataStateBoundary
        isLoading={loading}
        isError={Boolean(error)}
        errorMessage={error ?? t("issues", "failedToLoad")}
        isEmpty={data.length === 0}
        emptyTitle={t("issues", "reportedIssuesEmptyTitle")}
        emptyDescription={t("issues", "reportedIssuesEmptyDescription")}
      >
        <div className="space-y-2.5">
          {data.map((issue) => {
            const createdAt = formatDateParts(issue.created_at);
            const reportedItems = getReportedItems(issue, t);

            return (
              <ListRow
                key={issue.id}
                leading={<ShieldAlert className="h-4 w-4" />}
                title={issue.vehicle_license_plate || "—"}
                subtitle={
                  reportedItems.length > 0
                    ? reportedItems.join(" · ")
                    : t("issues", "issueHintNone")
                }
                badge={
                  <StatusBadge
                    label={getStatusLabel(issue.status, t)}
                    variant={getStatusVariant(issue.status)}
                  />
                }
                meta={
                  <>
                    <ListChip icon={<CarFront className="h-3 w-3" />} variant="blue">
                      {issue.vehicle_license_plate || "—"}
                    </ListChip>

                    <ListChip icon={<CalendarDays className="h-3 w-3" />}>
                      {createdAt.date}
                    </ListChip>

                    <ListChip icon={<Clock className="h-3 w-3" />}>
                      {createdAt.time}
                    </ListChip>
                  </>
                }
              />
            );
          })}
        </div>
      </DataStateBoundary>
    </SectionCard>
  );
}