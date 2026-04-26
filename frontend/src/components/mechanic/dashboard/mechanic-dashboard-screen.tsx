"use client";

import { useMemo } from "react";
import { CalendarDays, CarFront, TriangleAlert, UserRound } from "lucide-react";

import Card from "@/components/ui/card";
import DataStateBoundary from "@/components/patterns/data-state-boundary";
import SectionCard from "@/components/ui/section-card";
import StatusBadge from "@/components/ui/status-badge";

import { useSafeI18n } from "@/hooks/use-safe-i18n";
import { useMechanicIssues } from "@/hooks/issues/use-mechanic-issues";

import type { IssueItem } from "@/types/issue.types";

function normalizeStatus(status?: string | null): string {
  return String(status ?? "").trim().toLowerCase();
}

function formatDate(value?: string | null, localeTag = "ro-RO") {
  if (!value) return "—";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return new Intl.DateTimeFormat(localeTag, {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
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
      issue.need_service_in_km !== null
        ? `${t("issues", "serviceInKm")}: ${issue.need_service_in_km}`
        : null,
    ].filter(Boolean);

    return issue.other_problems || issue.dashboard_checks || parts.join(" · ") || "—";
  }

  return (
    <DataStateBoundary
      isLoading={loading}
      isError={Boolean(error)}
      errorMessage={error ?? t("issues", "failedToLoad")}
    >
      <div className="space-y-6">
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
            isEmpty={activeIssues.length === 0}
            emptyTitle={t("issues", "noOpenIssues")}
          >
            <div className="space-y-3">
              {activeIssues.map((issue) => (
                <Card key={issue.id} className="p-4">
                  <div className="flex flex-col gap-3">
                    <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <CarFront className="h-4 w-4 text-slate-300" />
                          <p className="truncate text-sm font-semibold text-white">
                            {buildVehicleTitle(issue)}
                          </p>
                        </div>

                        <p className="mt-2 text-sm text-slate-300">
                          {getIssueSummary(issue)}
                        </p>
                      </div>

                      <StatusBadge
                        label={t("issues", "openIssues")}
                        variant="danger"
                      />
                    </div>

                    <div className="flex flex-wrap gap-2 text-xs text-slate-300">
                      <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/10 px-3 py-1.5">
                        <CalendarDays className="h-3.5 w-3.5" />
                        {t("issues", "createdAt")}:{" "}
                        {formatDate(issue.created_at, localeTag)}
                      </span>

                      {issue.reported_by_name ? (
                        <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/10 px-3 py-1.5">
                          <UserRound className="h-3.5 w-3.5" />
                          {t("issues", "reportedBy")}:{" "}
                          {issue.reported_by_name}
                        </span>
                      ) : null}
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </DataStateBoundary>
        </SectionCard>
      </div>
    </DataStateBoundary>
  );
}