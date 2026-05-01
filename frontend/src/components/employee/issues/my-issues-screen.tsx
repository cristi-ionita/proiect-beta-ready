"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CalendarDays, Clock, MessageSquareText, Plus } from "lucide-react";

import DataStateBoundary from "@/components/patterns/data-state-boundary";
import AppModal from "@/components/ui/app-modal";
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
      month: "short",
      year: "numeric",
    }).format(parsed),
    time: new Intl.DateTimeFormat("ro-RO", {
      hour: "2-digit",
      minute: "2-digit",
    }).format(parsed),
  };
}

function normalizeStatus(status?: string | null) {
  return String(status ?? "").trim().toLowerCase();
}

function getStatusVariant(status: string) {
  if (status === "scheduled") return "info";
  if (status === "in_progress") return "warning";
  if (status === "resolved") return "success";
  if (status === "canceled") return "neutral";

  return "danger";
}

function getStatusLabel(issue: IssueItem) {
  const status = normalizeStatus(issue.status);

  if (status === "open" && issue.assigned_mechanic_id) {
    return "Trimisă";
  }

  if (status === "scheduled") return "Programată";
  if (status === "in_progress") return "În lucru";
  if (status === "resolved") return "Rezolvată";
  if (status === "canceled") return "Anulată";

  return "Raportată";
}

export default function MyIssuesScreen() {
  const router = useRouter();
  const { t } = useSafeI18n();
  const { data, loading, error } = useMyIssues();

  const [selectedIssue, setSelectedIssue] = useState<IssueItem | null>(null);

  const selectedStatus = normalizeStatus(selectedIssue?.status);
  const scheduledAt = formatDateParts(selectedIssue?.scheduled_for);

  return (
    <>
      <SectionCard
        title={t("issues", "historyTitle")}
        actions={
          <Button
            type="button"
            size="sm"
            className="flex h-9 w-9 items-center justify-center p-0"
            onClick={() => router.push("/employee/issues/report?from=issues")}
            aria-label={t("issues", "reportIssue")}
          >
            <Plus className="h-4 w-4" />
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

              return (
                <button
                  key={issue.id}
                  type="button"
                  onClick={() => setSelectedIssue(issue)}
                  className="flex w-full items-center gap-3 rounded-3xl border border-white/10 bg-white/10 p-4 text-left transition hover:bg-white/15"
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-bold text-white">
                      {issue.vehicle_license_plate || "—"}
                    </p>

                    <div className="mt-1 flex flex-wrap items-center gap-2 text-xs font-semibold text-slate-400">
                      <span>{createdAt.date}</span>
                      <span>•</span>
                      <span>{createdAt.time}</span>
                    </div>
                  </div>

                  <StatusBadge
                    label={getStatusLabel(issue)}
                    variant={getStatusVariant(normalizeStatus(issue.status))}
                    size="sm"
                  />
                </button>
              );
            })}
          </div>
        </DataStateBoundary>
      </SectionCard>

      <AppModal
        open={Boolean(selectedIssue)}
        onClose={() => setSelectedIssue(null)}
        title={selectedIssue?.vehicle_license_plate || "Problemă"}
      >
        {selectedIssue ? (
          <div className="space-y-4">
            <div className="rounded-2xl border border-white/10 bg-white/10 px-4 py-3">
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">
                Status
              </p>

              <div className="mt-2">
                <StatusBadge
                  label={getStatusLabel(selectedIssue)}
                  variant={getStatusVariant(selectedStatus)}
                />
              </div>
            </div>

            {selectedIssue.scheduled_for ? (
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-2xl border border-white/10 bg-white/10 px-4 py-3">
                  <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">
                    Data programării
                  </p>

                  <p className="mt-2 flex items-center gap-2 text-sm font-semibold text-white">
                    <CalendarDays className="h-4 w-4 shrink-0" />
                    {scheduledAt.date}
                  </p>
                </div>

                <div className="rounded-2xl border border-white/10 bg-white/10 px-4 py-3">
                  <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">
                    Ora
                  </p>

                  <p className="mt-2 flex items-center gap-2 text-sm font-semibold text-white">
                    <Clock className="h-4 w-4 shrink-0" />
                    {scheduledAt.time}
                  </p>
                </div>
              </div>
            ) : (
              <p className="rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-sm font-semibold text-slate-300">
                Problema nu a fost încă programată de mecanic.
              </p>
            )}

            {selectedIssue.scheduled_location ? (
              <div className="rounded-2xl border border-white/10 bg-white/10 px-4 py-3">
                <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">
                  Mesaj de la mecanic
                </p>

                <p className="mt-2 flex items-start gap-2 whitespace-pre-line text-sm font-semibold text-white">
                  <MessageSquareText className="mt-0.5 h-4 w-4 shrink-0" />
                  {selectedIssue.scheduled_location}
                </p>
              </div>
            ) : null}

            {selectedIssue.resolution_notes ? (
              <div className="rounded-2xl border border-white/10 bg-white/10 px-4 py-3">
                <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">
                  Notițe rezolvare
                </p>

                <p className="mt-2 whitespace-pre-line text-sm font-semibold text-white">
                  {selectedIssue.resolution_notes}
                </p>
              </div>
            ) : null}

            <div className="flex justify-end border-t border-white/10 pt-4">
              <Button type="button" onClick={() => setSelectedIssue(null)}>
                {selectedStatus === "scheduled"
                  ? "Confirmă programarea"
                  : "Închide"}
              </Button>
            </div>
          </div>
        ) : null}
      </AppModal>
    </>
  );
}