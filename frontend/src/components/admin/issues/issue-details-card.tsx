"use client";

import type { ReactNode } from "react";
import {
  CalendarDays,
  CarFront,
  Clock3,
  Settings2,
  TriangleAlert,
  UserRound,
  Wrench,
} from "lucide-react";

import SectionCard from "@/components/ui/section-card";
import StatusBadge from "@/components/ui/status-badge";

import { useSafeI18n } from "@/hooks/use-safe-i18n";
import { cn, formatDate } from "@/lib/utils";
import {
  getIssueStatusLabel,
  getIssueStatusVariant,
} from "@/lib/status/issue-status";

import type { IssueItem } from "@/types/issue.types";
import type { Locale } from "@/lib/i18n/dictionaries";

type IssueDetailsCardProps = {
  issue: IssueItem;
  locale: Locale;
};

function getPriorityLabel(priority?: string | null) {
  switch ((priority || "").toLowerCase()) {
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

function getPriorityVariant(priority?: string | null) {
  switch ((priority || "").toLowerCase()) {
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

export default function IssueDetailsCard({
  issue,
}: IssueDetailsCardProps) {
  const { t, localeTag } = useSafeI18n();

  function yesNo(value?: boolean | null) {
    return value ? t("common", "yes") : t("common", "no");
  }

  return (
    <SectionCard
      title={`${t("issues", "details")} #${issue.id}`}
      actions={
        <div className="flex flex-wrap items-center gap-2">
          <StatusBadge
            label={getIssueStatusLabel(issue.status)}
            variant={getIssueStatusVariant(issue.status)}
            size="md"
          />

          {issue.priority ? (
            <StatusBadge
              label={getPriorityLabel(issue.priority)}
              variant={getPriorityVariant(issue.priority)}
              size="md"
            />
          ) : null}
        </div>
      }
    >
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          <InfoTile
            icon={<CarFront className="h-4 w-4 text-slate-300" />}
            label={t("issues", "vehiclePlate")}
            value={issue.vehicle_license_plate || "—"}
          />

          <InfoTile
            icon={<CarFront className="h-4 w-4 text-slate-300" />}
            label={t("common", "vehicle")}
            value={`${issue.vehicle_brand || "—"} ${
              issue.vehicle_model || ""
            }`.trim()}
          />

          <InfoTile
            icon={<UserRound className="h-4 w-4 text-slate-300" />}
            label={t("issues", "reportedBy")}
            value={issue.reported_by_name || "—"}
          />

          <InfoTile
            icon={<CalendarDays className="h-4 w-4 text-slate-300" />}
            label={t("issues", "createdAt")}
            value={formatDate(issue.created_at, localeTag)}
          />

          <InfoTile
            icon={<Clock3 className="h-4 w-4 text-slate-300" />}
            label={t("issues", "updatedAt")}
            value={formatDate(issue.updated_at, localeTag)}
          />

          <InfoTile
            icon={<Settings2 className="h-4 w-4 text-slate-300" />}
            label={t("issues", "serviceInKm")}
            value={
              issue.need_service_in_km != null
                ? String(issue.need_service_in_km)
                : "—"
            }
          />
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <StatusTile
            label={t("issues", "brakes")}
            value={yesNo(issue.need_brakes)}
            active={Boolean(issue.need_brakes)}
            icon={<Wrench className="h-4 w-4 text-slate-300" />}
          />

          <StatusTile
            label={t("issues", "tires")}
            value={yesNo(issue.need_tires)}
            active={Boolean(issue.need_tires)}
            icon={<Wrench className="h-4 w-4 text-slate-300" />}
          />

          <StatusTile
            label={t("issues", "oil")}
            value={yesNo(issue.need_oil)}
            active={Boolean(issue.need_oil)}
            icon={<Wrench className="h-4 w-4 text-slate-300" />}
          />
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <InfoTile
            icon={<CalendarDays className="h-4 w-4 text-slate-300" />}
            label={t("issues", "scheduledFor")}
            value={formatDate(issue.scheduled_for, localeTag)}
          />

          <InfoTile
            icon={<TriangleAlert className="h-4 w-4 text-slate-300" />}
            label={t("issues", "scheduledLocation")}
            value={issue.scheduled_location || "—"}
          />
        </div>

        <div className="grid gap-4 xl:grid-cols-2">
          <TextBlock
            title={t("issues", "dashboardChecks")}
            value={issue.dashboard_checks}
          />

          <TextBlock
            title={t("issues", "otherProblems")}
            value={issue.other_problems}
          />
        </div>
      </div>
    </SectionCard>
  );
}

function InfoTile({
  icon,
  label,
  value,
}: {
  icon: ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-[18px] border border-white/10 bg-white/5 p-4">
      <div className="flex items-center gap-2">
        {icon}
        <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-400">
          {label}
        </p>
      </div>

      <p className="mt-3 break-words text-sm font-medium text-white">
        {value}
      </p>
    </div>
  );
}

function StatusTile({
  icon,
  label,
  value,
  active,
}: {
  icon: ReactNode;
  label: string;
  value: string;
  active: boolean;
}) {
  return (
    <div className="rounded-[18px] border border-white/10 bg-white/5 p-4">
      <div className="flex items-center gap-2">
        {icon}
        <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-400">
          {label}
        </p>
      </div>

      <span
        className={cn(
          "mt-3 inline-flex rounded-full border px-3 py-1.5 text-xs font-semibold",
          active
            ? "border-amber-200 bg-amber-50 text-amber-700"
            : "border-slate-200 bg-slate-100 text-slate-600"
        )}
      >
        {value}
      </span>
    </div>
  );
}

function TextBlock({
  title,
  value,
}: {
  title: string;
  value?: string | null;
}) {
  return (
    <div className="rounded-[18px] border border-white/10 bg-white/5 p-4">
      <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-400">
        {title}
      </p>

      <p className="mt-3 min-h-[80px] whitespace-pre-wrap break-words text-sm text-slate-200">
        {value?.trim() || "—"}
      </p>
    </div>
  );
}