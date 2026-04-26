"use client";

import { useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import DataStateBoundary from "@/components/patterns/data-state-boundary";
import SectionCard from "@/components/ui/section-card";
import StatusBadge from "@/components/ui/status-badge";
import Button from "@/components/ui/button";

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
    <DataStateBoundary
      isLoading={loading}
      isError={Boolean(error)}
      errorMessage={error ?? t("issues", "failedToLoad")}
    >
      <div className="space-y-6">
        {showBackButton ? (
          <div className="flex items-center justify-start">
            <Button
              variant="ghost"
              onClick={() => router.push("/admin/dashboard")}
              className="rounded-full border border-white/10 bg-white/10 px-4 py-2 text-white backdrop-blur-md hover:bg-white/15"
            >
              <ArrowLeft className="h-4 w-4" />
              {t("common", "back")}
            </Button>
          </div>
        ) : null}

        <SectionCard title={t("issues", "openIssues")}>
          <DataStateBoundary
            isEmpty={sortedIssues.length === 0}
            emptyTitle={t("issues", "noOpenIssues")}
          >
            <div className="overflow-hidden rounded-[22px] border border-white/10 bg-white/5">
              <div className="grid grid-cols-4 gap-4 border-b border-white/10 px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-400">
                <span>{t("common", "status")}</span>
                <span>{t("common", "vehicle")}</span>
                <span>{t("common", "date")}</span>
                <span className="text-right">{t("issues", "priority")}</span>
              </div>

              {sortedIssues.map((issue: IssueItem, index) => (
                <button
                  key={issue.id}
                  onClick={() => router.push(`/admin/issues/${issue.id}`)}
                  className="grid w-full grid-cols-4 gap-4 px-4 py-3 text-left transition hover:bg-white/5"
                >
                  <div>
                    <StatusBadge
                      label={getIssueStatusLabel(issue.status)}
                      variant={getIssueStatusVariant(issue.status)}
                    />
                  </div>

                  <div className="text-sm font-medium text-white">
                    {issue.vehicle_license_plate || "—"}
                  </div>

                  <div className="text-sm text-slate-300">
                    {formatDate(issue.created_at, localeTag)}
                  </div>

                  <div className="flex justify-end">
                    <StatusBadge
                      label={getPriorityLabel(issue.priority)}
                      variant={getPriorityVariant(issue.priority)}
                      size="sm"
                    />
                  </div>

                  {index < sortedIssues.length - 1 ? (
                    <div className="col-span-4 border-b border-white/5" />
                  ) : null}
                </button>
              ))}
            </div>
          </DataStateBoundary>
        </SectionCard>
      </div>
    </DataStateBoundary>
  );
}