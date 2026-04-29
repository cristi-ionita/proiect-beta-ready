"use client";

import { useMemo } from "react";
import { CalendarDays, CarFront, TriangleAlert, UserRound } from "lucide-react";

import DataStateBoundary from "@/components/patterns/data-state-boundary";
import ListChip from "@/components/patterns/list-chip";
import ListRow from "@/components/patterns/list-row";
import SectionCard from "@/components/ui/section-card";
import StatusBadge from "@/components/ui/status-badge";
import { useMechanicIssues } from "@/hooks/issues/use-mechanic-issues";
import { useSafeI18n } from "@/hooks/use-safe-i18n";
import { formatDate } from "@/lib/utils";
import type { IssueItem } from "@/types/issue.types";

function normalizeStatus(status?: string | null): string {
  return String(status ?? "").trim().toLowerCase();
}

function buildVehicleTitle(issue: IssueItem) {
  const plate = issue.vehicle_license_plate || "—";
  const brand = issue.vehicle_brand || "";
  const model = issue.vehicle_model || "";
  const vehicleName = `${brand} ${model}`.trim();

  return vehicleName ? `${plate} · ${vehicleName}` : plate;
}

export default function MechanicDashboardScreen() {
  const { t, localeTag } = useSafeI18n();
  const { issues, loading, error } = useMechanicIssues();

  const activeIssues = useMemo(() => {
    return issues.filter((issue) => {
      const status = normalizeStatus(issue.status);
      return status === "open" || status === "in_progress";
    });
  }, [issues]);

  function getIssueSummary(issue: IssueItem) {
    const parts = [
      issue.need_brakes ? t("issues", "brakes") : null,
      issue.need_tires ? t("issues", "tires") : null,
      issue.need_oil ? t("issues", "oil") : null,
      issue.need_service_in_km !== null && issue.need_service_in_km !== undefined
        ? `${t("issues", "serviceInKm")}: ${issue.need_service_in_km} km`
        : null,
      issue.dashboard_checks?.trim() || null,
      issue.other_problems?.trim() || null,
    ].filter(Boolean);

    return parts.length > 0 ? parts.join(" · ") : "—";
  }

  return (
    <SectionCard
      title={t("dashboard", "activeIssues")}
      icon={<TriangleAlert className="h-5 w-5" />}
      actions={
        <div className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-700">
          {activeIssues.length}
        </div>
      }
    >
      <DataStateBoundary
        isLoading={loading}
        isError={Boolean(error)}
        errorMessage={error ?? t("issues", "failedToLoad")}
        isEmpty={activeIssues.length === 0}
        emptyTitle={t("issues", "noOpenIssues")}
      >
        <div className="space-y-2.5">
          {activeIssues.map((issue) => (
            <ListRow
              key={issue.id}
              leading={<CarFront className="h-4 w-4" />}
              title={buildVehicleTitle(issue)}
              subtitle={getIssueSummary(issue)}
              badge={
                <StatusBadge
                  label={t("issues", "open")}
                  variant="danger"
                />
              }
              meta={
                <>
                  <ListChip icon={<CalendarDays className="h-3 w-3" />}>
                    {t("issues", "createdAt")}:{" "}
                    {formatDate(issue.created_at, localeTag)}
                  </ListChip>

                  {issue.reported_by_name ? (
                    <ListChip icon={<UserRound className="h-3 w-3" />}>
                      {t("issues", "reportedBy")}: {issue.reported_by_name}
                    </ListChip>
                  ) : null}
                </>
              }
            />
          ))}
        </div>
      </DataStateBoundary>
    </SectionCard>
  );
}