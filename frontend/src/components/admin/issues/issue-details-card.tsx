"use client";

import { CalendarDays, CarFront, ImageIcon, UserRound } from "lucide-react";

import ListChip from "@/components/patterns/list-chip";
import ListRow from "@/components/patterns/list-row";
import SectionCard from "@/components/ui/section-card";
import StatusBadge from "@/components/ui/status-badge";
import { useSafeI18n } from "@/hooks/use-safe-i18n";
import {
  getIssueStatusLabel,
  getIssueStatusVariant,
} from "@/lib/status/issue-status";
import { formatDate } from "@/lib/utils";
import type { IssueItem } from "@/types/issue.types";

type Props = {
  issue: IssueItem;
  locale: string;
};

type IssuePhoto = {
  id?: number | string;
  url?: string | null;
  file_url?: string | null;
  path?: string | null;
};

type IssueDetailsExtra = IssueItem & {
  brakes?: boolean | null;
  tires?: boolean | null;
  oil?: boolean | null;

  service_in_km?: string | number | null;
  scheduled_for?: string | null;
  scheduled_location?: string | null;
  dashboard_checks?: string | null;
  other_problems?: string | null;

  reported_by_name?: string | null;
  reporter_name?: string | null;
  created_by_name?: string | null;

  photos?: IssuePhoto[] | null;
  service_photos?: IssuePhoto[] | null;
  dashboard_photos?: IssuePhoto[] | null;
  other_photos?: IssuePhoto[] | null;
};

function hasText(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function getPhotoUrl(photo: IssuePhoto): string | null {
  return photo.url || photo.file_url || photo.path || null;
}

export default function IssueDetailsCard({ issue, locale }: Props) {
  const { t } = useSafeI18n();
  const details = issue as IssueDetailsExtra;
  const fallback = "—";

  const reporterName =
    details.reported_by_name ||
    details.reporter_name ||
    details.created_by_name ||
    fallback;

  const reportedItems = [
    details.brakes
      ? {
          key: "brakes",
          label: t("issues", "brakes"),
          value: t("common", "yes"),
        }
      : null,

    details.tires
      ? {
          key: "tires",
          label: t("issues", "tires"),
          value: t("common", "yes"),
        }
      : null,

    details.oil
      ? {
          key: "oil",
          label: t("issues", "oil"),
          value: t("common", "yes"),
        }
      : null,

    details.service_in_km
      ? {
          key: "service_in_km",
          label: t("issues", "serviceInKm"),
          value: String(details.service_in_km),
        }
      : null,

    hasText(details.scheduled_for)
      ? {
          key: "scheduled_for",
          label: t("issues", "scheduledFor"),
          value: formatDate(details.scheduled_for, locale),
        }
      : null,

    hasText(details.scheduled_location)
      ? {
          key: "scheduled_location",
          label: t("issues", "scheduledLocation"),
          value: details.scheduled_location,
        }
      : null,

    hasText(details.dashboard_checks)
      ? {
          key: "dashboard_checks",
          label: t("issues", "dashboardChecks"),
          value: details.dashboard_checks,
        }
      : null,

    hasText(details.other_problems)
      ? {
          key: "other_problems",
          label: t("issues", "otherProblems"),
          value: details.other_problems,
        }
      : null,
  ].filter(Boolean) as Array<{
    key: string;
    label: string;
    value: string;
  }>;

  const photos = [
    ...(details.photos ?? []),
    ...(details.service_photos ?? []),
    ...(details.dashboard_photos ?? []),
    ...(details.other_photos ?? []),
  ].filter((photo) => Boolean(getPhotoUrl(photo)));

  return (
    <div className="space-y-4">
      <SectionCard
        title={t("issues", "details")}
        actions={
          <StatusBadge
            label={getIssueStatusLabel(issue.status)}
            variant={getIssueStatusVariant(issue.status)}
          />
        }
      >
        <ListRow
          leading={<CarFront className="h-4 w-4" />}
          title={issue.vehicle_license_plate || fallback}
          meta={
            <>
              <ListChip icon={<UserRound className="h-3 w-3" />}>
                {t("issues", "reportedBy")}: {reporterName}
              </ListChip>

              <ListChip icon={<CalendarDays className="h-3 w-3" />}>
                {t("issues", "createdAt")}:{" "}
                {formatDate(issue.created_at, locale)}
              </ListChip>

              {issue.updated_at ? (
                <ListChip icon={<CalendarDays className="h-3 w-3" />}>
                  {t("issues", "updatedAt")}:{" "}
                  {formatDate(issue.updated_at, locale)}
                </ListChip>
              ) : null}
            </>
          }
        />
      </SectionCard>

      {(reportedItems.length > 0 || photos.length > 0) && (
        <SectionCard title={t("issues", "reportIssue")}>
          <div className="space-y-3">
            {reportedItems.map((item) => (
              <div
                key={item.key}
                className="rounded-2xl border border-white/10 bg-white/10 px-4 py-3"
              >
                <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">
                  {item.label}
                </p>

                <p className="mt-1 whitespace-pre-line text-sm font-semibold text-white">
                  {item.value}
                </p>
              </div>
            ))}

            {photos.length > 0 ? (
              <div className="rounded-2xl border border-white/10 bg-white/10 p-4">
                <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-white">
                  <ImageIcon className="h-4 w-4" />
                  {t("issues", "addPhotos")}
                </div>

                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {photos.map((photo, index) => {
                    const url = getPhotoUrl(photo);
                    if (!url) return null;

                    return (
                      <a
                        key={photo.id ?? index}
                        href={url}
                        target="_blank"
                        rel="noreferrer"
                        className="overflow-hidden rounded-2xl border border-white/10 bg-black/20"
                      >
                        <img
                          src={url}
                          alt={`${t("issues", "addPhotos")} ${index + 1}`}
                          className="h-40 w-full object-cover"
                        />
                      </a>
                    );
                  })}
                </div>
              </div>
            ) : null}
          </div>
        </SectionCard>
      )}
    </div>
  );
}