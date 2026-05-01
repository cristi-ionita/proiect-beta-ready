"use client";

import { useEffect, useState } from "react";
import {
  CalendarDays,
  CarFront,
  ImageIcon,
  Send,
  UserRound,
  Wrench,
} from "lucide-react";
import { useRouter } from "next/navigation";

import ListChip from "@/components/patterns/list-chip";
import ListRow from "@/components/patterns/list-row";
import AppModal from "@/components/ui/app-modal";
import Button from "@/components/ui/button";
import SectionCard from "@/components/ui/section-card";
import StatusBadge from "@/components/ui/status-badge";
import { useSafeI18n } from "@/hooks/use-safe-i18n";
import {
  getIssueStatusLabel,
  getIssueStatusVariant,
} from "@/lib/status/issue-status";
import { formatDate } from "@/lib/utils";
import { adminDownloadIssuePhoto, updateIssueStatus } from "@/services/issues.api";
import type { IssueItem } from "@/types/issue.types";
import { listUsers } from "@/services/users.api";
import type { UserItem } from "@/types/user.types";

type Props = {
  issue: IssueItem;
  locale: string;
};

type IssuePhoto = {
  id?: number | string;
  file_name?: string | null;
  mime_type?: string | null;
  file_size?: number | null;
};

type IssueDetailsExtra = IssueItem & {
  brakes?: boolean | null;
  tires?: boolean | null;
  oil?: boolean | null;
  need_brakes?: boolean | null;
  need_tires?: boolean | null;
  need_oil?: boolean | null;
  need_service_in_km?: number | null;
  service_in_km?: string | number | null;
  dashboard_checks?: string | null;
  other_problems?: string | null;
  reported_by_name?: string | null;
  reporter_name?: string | null;
  created_by_name?: string | null;
  reported_by_shift_number?: number | string | null;
  assigned_mechanic_id?: number | null;
  photos?: IssuePhoto[] | null;
};

function hasText(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function formatFileSize(bytes?: number | null): string {
  if (!bytes || bytes <= 0) return "—";
  return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
}

export default function IssueDetailsCard({ issue, locale }: Props) {
  const router = useRouter();
  const { t } = useSafeI18n();
  const details = issue as IssueDetailsExtra;
  const fallback = "—";

  const [photoUrls, setPhotoUrls] = useState<Record<string, string>>({});
  const [selectedPhoto, setSelectedPhoto] = useState<IssuePhoto | null>(null);

  const [mechanics, setMechanics] = useState<UserItem[]>([]);
  const [selectedMechanicId, setSelectedMechanicId] = useState(
    details.assigned_mechanic_id ? String(details.assigned_mechanic_id) : ""
  );
  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [loadingMechanics, setLoadingMechanics] = useState(false);
  const [assigning, setAssigning] = useState(false);
  const [assignError, setAssignError] = useState("");

  useEffect(() => {
    let active = true;
    const createdUrls: string[] = [];

    async function loadPhotos() {
      const entries: Record<string, string> = {};

      for (const photo of details.photos ?? []) {
        if (!photo.id) continue;

        try {
          const blob = await adminDownloadIssuePhoto(Number(photo.id));
          const objectUrl = URL.createObjectURL(blob);
          createdUrls.push(objectUrl);
          entries[String(photo.id)] = objectUrl;
        } catch {
          // poza rămâne indisponibilă
        }
      }

      if (active) setPhotoUrls(entries);
    }

    void loadPhotos();

    return () => {
      active = false;
      createdUrls.forEach((url) => URL.revokeObjectURL(url));
    };
  }, [details.photos]);

  useEffect(() => {
    async function loadMechanics() {
      try {
        setLoadingMechanics(true);
        setAssignError("");

        const users = await listUsers({
          active_only: true,
          role: "mechanic",
          status: "approved",
        });

        setMechanics(users);
      } catch {
        setMechanics([]);
        setAssignError(t("issues", "failedToLoadMechanics"));
      } finally {
        setLoadingMechanics(false);
      }
    }

    void loadMechanics();
  }, [t]);

  const reporterName =
    details.reported_by_name ||
    details.reporter_name ||
    details.created_by_name ||
    fallback;

  const reportedItems = [
    details.brakes || details.need_brakes
      ? { key: "brakes", label: t("issues", "brakes"), value: t("common", "yes") }
      : null,
    details.tires || details.need_tires
      ? { key: "tires", label: t("issues", "tires"), value: t("common", "yes") }
      : null,
    details.oil || details.need_oil
      ? { key: "oil", label: t("issues", "oil"), value: t("common", "yes") }
      : null,
    details.service_in_km || details.need_service_in_km
      ? {
          key: "service_in_km",
          label: t("issues", "serviceInKm"),
          value: String(details.service_in_km ?? details.need_service_in_km),
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
  ].filter(Boolean) as Array<{ key: string; label: string; value: string }>;

  const photos = details.photos ?? [];
  const selectedPhotoUrl = selectedPhoto?.id
    ? photoUrls[String(selectedPhoto.id)]
    : null;

  async function handleSendToMechanic() {
    const mechanicId = Number(selectedMechanicId);

    if (!mechanicId || Number.isNaN(mechanicId)) {
      setAssignError(t("issues", "selectMechanic"));
      return;
    }

    try {
      setAssigning(true);
      setAssignError("");

      await updateIssueStatus(issue.id, {
        assigned_mechanic_id: mechanicId,
      });

      setAssignModalOpen(false);
      router.push("/admin/issues");
    } catch {
      setAssignError(t("issues", "failedToSendToMechanic"));
    } finally {
      setAssigning(false);
    }
  }

  return (
    <>
      <SectionCard
        title={t("issues", "details")}
        actions={
          <StatusBadge
            label={getIssueStatusLabel(issue.status)}
            variant={getIssueStatusVariant(issue.status)}
          />
        }
      >
        <div className="space-y-4">
          <ListRow
            leading={<CarFront className="h-4 w-4" />}
            title={issue.vehicle_license_plate || fallback}
            meta={
              <>
                <ListChip icon={<UserRound className="h-3 w-3" />}>
                  {t("issues", "reportedBy")}: {reporterName}
                </ListChip>

                <ListChip icon={<UserRound className="h-3 w-3" />}>
                  {t("common", "shift")}:{" "}
                  {details.reported_by_shift_number ?? fallback}
                </ListChip>

                <ListChip icon={<CalendarDays className="h-3 w-3" />}>
                  {t("issues", "createdAt")}:{" "}
                  {formatDate(issue.created_at, locale)}
                </ListChip>
              </>
            }
          />

          {reportedItems.length > 0 ? (
            <div className="grid gap-3 md:grid-cols-2">
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
            </div>
          ) : (
            <p className="rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-sm font-semibold text-slate-300">
              {t("issues", "noReportedDetails")}
            </p>
          )}

          {photos.length > 0 ? (
            <div className="rounded-2xl border border-white/10 bg-white/10 p-4">
              <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-white">
                <ImageIcon className="h-4 w-4" />
                {t("issues", "attachedPhotos")}
              </div>

              <div className="space-y-2">
                {photos.map((photo, index) => {
                  const hasLoadedUrl = photo.id && photoUrls[String(photo.id)];

                  return (
                    <button
                      key={photo.id ?? index}
                      type="button"
                      onClick={() => setSelectedPhoto(photo)}
                      disabled={!hasLoadedUrl}
                      aria-label={t("issues", "openPhoto")}
                      className="flex w-full items-center justify-between gap-4 rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-left transition hover:bg-white/15 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <div className="flex min-w-0 items-center gap-3">
                        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-black text-white">
                          <ImageIcon className="h-4 w-4" />
                        </span>

                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold text-white">
                            {photo.file_name ||
                              `${t("issues", "issuePhoto")} ${index + 1}`}
                          </p>
                          <p className="mt-1 text-xs text-slate-400">
                            {photo.mime_type || "image"} ·{" "}
                            {formatFileSize(photo.file_size)}
                          </p>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          ) : null}

          {!details.assigned_mechanic_id ? (
            <div className="flex justify-end border-t border-white/10 pt-4">
              <Button type="button" onClick={() => setAssignModalOpen(true)}>
                <Send className="h-4 w-4" />
                {t("issues", "sendToMechanic")}
              </Button>
            </div>
          ) : (
            <div className="flex justify-end border-t border-white/10 pt-4">
              <span className="inline-flex items-center gap-2 rounded-2xl border border-emerald-400/20 bg-emerald-500/10 px-4 py-2 text-sm font-semibold text-emerald-200">
                <Wrench className="h-4 w-4" />
                {t("issues", "sentToMechanic")}
              </span>
            </div>
          )}
        </div>
      </SectionCard>

      <AppModal
        open={Boolean(selectedPhoto)}
        onClose={() => setSelectedPhoto(null)}
        title={selectedPhoto?.file_name || t("issues", "issuePhoto")}
      >
        {selectedPhotoUrl ? (
          <img
            src={selectedPhotoUrl}
            alt={selectedPhoto?.file_name || t("issues", "issuePhoto")}
            className="max-h-[70vh] w-full rounded-2xl object-contain"
          />
        ) : (
          <p className="text-sm text-slate-300">
            {t("issues", "photoUnavailable")}
          </p>
        )}
      </AppModal>

      <AppModal
        open={assignModalOpen}
        onClose={() => {
          if (!assigning) setAssignModalOpen(false);
        }}
        title={t("issues", "sendToMechanic")}
        subtitle={t("issues", "assignIssue")}
        loading={loadingMechanics}
        error={assignError}
      >
        <div className="space-y-4">
          <div>
            <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">
              {t("issues", "selectMechanic")}
            </label>

            <select
              value={selectedMechanicId}
              onChange={(event) => {
                setSelectedMechanicId(event.target.value);
                setAssignError("");
              }}
              disabled={assigning}
              className="h-11 w-full rounded-2xl border border-white/10 bg-white/10 px-4 text-sm font-semibold text-white outline-none transition focus:border-white/20 focus:bg-white/15"
            >
              <option value="" className="text-slate-900">
                {t("issues", "selectMechanic")}
              </option>

              {mechanics.map((mechanic) => (
                <option
                  key={mechanic.id}
                  value={mechanic.id}
                  className="text-slate-900"
                >
                  {mechanic.full_name}
                  {mechanic.username ? ` (${mechanic.username})` : ""}
                </option>
              ))}
            </select>
          </div>

          <div className="flex justify-end gap-3 border-t border-white/10 pt-4">
            <Button
              type="button"
              variant="secondary"
              disabled={assigning}
              onClick={() => setAssignModalOpen(false)}
            >
              {t("common", "cancel")}
            </Button>

            <Button
              type="button"
              disabled={assigning || !selectedMechanicId}
              onClick={handleSendToMechanic}
            >
              <Send className="h-4 w-4" />
              {assigning
                ? t("issues", "sendingToMechanic")
                : t("issues", "confirmSendToMechanic")}
            </Button>
          </div>
        </div>
      </AppModal>
    </>
  );
}