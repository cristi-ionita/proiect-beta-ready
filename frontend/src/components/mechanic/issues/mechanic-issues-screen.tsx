"use client";

import { useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  CalendarDays,
  CarFront,
  CheckCircle2,
  History,
  PlayCircle,
  TriangleAlert,
  UserRound,
} from "lucide-react";

import DataStateBoundary from "@/components/patterns/data-state-boundary";
import ListChip from "@/components/patterns/list-chip";
import ListRow from "@/components/patterns/list-row";
import AppModal from "@/components/ui/app-modal";
import Button from "@/components/ui/button";
import FormField from "@/components/ui/form-field";
import Input from "@/components/ui/input";
import SectionCard from "@/components/ui/section-card";
import StatusBadge from "@/components/ui/status-badge";
import Textarea from "@/components/ui/textarea";
import { useMechanicIssues } from "@/hooks/issues/use-mechanic-issues";
import { useSafeI18n } from "@/hooks/use-safe-i18n";
import { formatDate } from "@/lib/utils";
import {
  mechanicResolveIssue,
  mechanicScheduleIssue,
  mechanicStartIssue,
} from "@/services/issues.api";
import type { IssueItem } from "@/types/issue.types";

function normalizeStatus(status?: string | null): string {
  return String(status ?? "").trim().toLowerCase();
}

function buildVehicleTitle(issue: IssueItem): string {
  const plate = issue.vehicle_license_plate || "—";
  const brand = issue.vehicle_brand || "";
  const model = issue.vehicle_model || "";
  const vehicleName = `${brand} ${model}`.trim();

  return vehicleName ? `${plate} · ${vehicleName}` : plate;
}

function getIssueSummary(issue: IssueItem): string {
  const parts = [
    issue.need_brakes ? "Frâne" : null,
    issue.need_tires ? "Anvelope" : null,
    issue.need_oil ? "Ulei" : null,
    issue.need_service_in_km != null
      ? `Service în ${issue.need_service_in_km} km`
      : null,
    issue.dashboard_checks?.trim() || null,
    issue.other_problems?.trim() || null,
  ].filter(Boolean);

  return parts.length > 0 ? parts.join(" · ") : "—";
}

function getBadgeVariant(status: string) {
  if (status === "resolved") return "success";
  if (status === "scheduled") return "warning";
  if (status === "in_progress") return "info";
  if (status === "canceled") return "neutral";
  return "danger";
}

function toDatetimeLocalValue(value?: string | null) {
  if (!value) return "";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  const offsetMs = date.getTimezoneOffset() * 60_000;
  const localDate = new Date(date.getTime() - offsetMs);

  return localDate.toISOString().slice(0, 16);
}

export default function MechanicIssuesScreen() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const filter = searchParams.get("filter") ?? "all";

  const { t, localeTag } = useSafeI18n();
  const { issues, loading, error, refetch } = useMechanicIssues();

  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState("");

  const [scheduleIssue, setScheduleIssue] = useState<IssueItem | null>(null);
  const [scheduledFor, setScheduledFor] = useState("");
  const [scheduledLocation, setScheduledLocation] = useState("");

  const [resolveIssue, setResolveIssue] = useState<IssueItem | null>(null);
  const [resolutionNotes, setResolutionNotes] = useState("");
  const [finalCost, setFinalCost] = useState("");

  const filteredIssues = useMemo(() => {
    if (filter === "scheduled") {
      return issues.filter(
        (issue) => normalizeStatus(issue.status) === "scheduled"
      );
    }

    if (filter === "in_progress") {
      return issues.filter(
        (issue) => normalizeStatus(issue.status) === "in_progress"
      );
    }

    if (filter === "history") {
      return issues.filter((issue) => {
        const status = normalizeStatus(issue.status);
        return status === "resolved" || status === "canceled";
      });
    }

    return issues;
  }, [filter, issues]);

  const title =
    filter === "scheduled"
      ? "Programări probleme"
      : filter === "in_progress"
      ? "Probleme în lucru"
      : filter === "history"
      ? "Istoric probleme"
      : "Toate problemele asignate";

  const icon =
    filter === "history" ? (
      <History className="h-5 w-5" />
    ) : filter === "scheduled" ? (
      <CalendarDays className="h-5 w-5" />
    ) : (
      <TriangleAlert className="h-5 w-5" />
    );

  function openScheduleModal(issue: IssueItem) {
    setScheduleIssue(issue);
    setScheduledFor(toDatetimeLocalValue(issue.scheduled_for));
    setScheduledLocation(issue.scheduled_location ?? "");
    setActionError("");
  }

  async function handleScheduleIssue() {
    if (!scheduleIssue) return;

    if (!scheduledFor.trim()) {
      setActionError("Data programării este obligatorie.");
      return;
    }

    try {
      setActionLoading(true);
      setActionError("");

      await mechanicScheduleIssue(scheduleIssue.id, {
        scheduled_for: new Date(scheduledFor).toISOString(),
        scheduled_location: scheduledLocation.trim() || null,
      });

      await refetch();

      setScheduleIssue(null);
      setScheduledFor("");
      setScheduledLocation("");
    } catch {
      setActionError("Nu s-a putut programa problema.");
    } finally {
      setActionLoading(false);
    }
  }

  async function handleStartIssue(issueId: number) {
    try {
      setActionLoading(true);
      setActionError("");

      await mechanicStartIssue(issueId);
      await refetch();
    } catch {
      setActionError("Nu s-a putut porni lucrarea.");
    } finally {
      setActionLoading(false);
    }
  }

  function openResolveModal(issue: IssueItem) {
    setResolveIssue(issue);
    setResolutionNotes(issue.resolution_notes ?? "");
    setFinalCost(issue.final_cost != null ? String(issue.final_cost) : "");
    setActionError("");
  }

  async function handleResolveIssue() {
    if (!resolveIssue) return;

    const parsedFinalCost =
      finalCost.trim() === "" ? null : Number(finalCost.trim());

    if (parsedFinalCost !== null && !Number.isFinite(parsedFinalCost)) {
      setActionError("Costul final este invalid.");
      return;
    }

    try {
      setActionLoading(true);
      setActionError("");

      await mechanicResolveIssue(resolveIssue.id, {
        resolution_notes: resolutionNotes.trim() || null,
        final_cost: parsedFinalCost,
      });

      await refetch();

      setResolveIssue(null);
      setResolutionNotes("");
      setFinalCost("");
    } catch {
      setActionError("Nu s-a putut rezolva problema.");
    } finally {
      setActionLoading(false);
    }
  }

  return (
    <>
      <div className="space-y-4">
        <div>
          <button
            type="button"
            onClick={() => router.push("/mechanic/dashboard")}
            className="inline-flex h-10 items-center justify-center gap-2 rounded-2xl bg-black px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-900"
          >
            Înapoi
          </button>
        </div>

        <SectionCard
          title={title}
          icon={icon}
          actions={
            <div className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-700">
              {filteredIssues.length}
            </div>
          }
        >
          {actionError ? (
            <p className="mb-3 rounded-2xl border border-red-400/20 bg-red-500/10 px-4 py-3 text-sm font-semibold text-red-200">
              {actionError}
            </p>
          ) : null}

          <DataStateBoundary
            isLoading={loading}
            isError={Boolean(error)}
            errorMessage={error ?? t("issues", "failedToLoad")}
            isEmpty={filteredIssues.length === 0}
            emptyTitle="Nu există probleme asignate mechanic-ului."
          >
            <div className="space-y-2.5">
              {filteredIssues.map((issue) => {
                const status = normalizeStatus(issue.status);

                return (
                  <ListRow
                    key={issue.id}
                    leading={<CarFront className="h-4 w-4" />}
                    title={buildVehicleTitle(issue)}
                    subtitle={getIssueSummary(issue)}
                    badge={
                      <StatusBadge
                        label={status || "open"}
                        variant={getBadgeVariant(status)}
                      />
                    }
                    meta={
                      <>
                        <ListChip icon={<CalendarDays className="h-3 w-3" />}>
                          Creată: {formatDate(issue.created_at, localeTag)}
                        </ListChip>

                        {issue.scheduled_for ? (
                          <ListChip icon={<CalendarDays className="h-3 w-3" />}>
                            Programată:{" "}
                            {formatDate(issue.scheduled_for, localeTag)}
                          </ListChip>
                        ) : null}

                        {issue.reported_by_name ? (
                          <ListChip icon={<UserRound className="h-3 w-3" />}>
                            Raportată de: {issue.reported_by_name}
                          </ListChip>
                        ) : null}

                        {issue.scheduled_location ? (
                          <ListChip>
                            Mesaj: {issue.scheduled_location}
                          </ListChip>
                        ) : null}
                      </>
                    }
                    actions={
                      <div className="flex flex-wrap justify-end gap-2">
                        {status === "open" ? (
                          <Button
                            type="button"
                            onClick={() => openScheduleModal(issue)}
                            disabled={actionLoading}
                          >
                            <CalendarDays className="h-4 w-4" />
                            Programează
                          </Button>
                        ) : null}

                        {status === "scheduled" ? (
                          <Button
                            type="button"
                            onClick={() => handleStartIssue(issue.id)}
                            disabled={actionLoading}
                            loading={actionLoading}
                          >
                            <PlayCircle className="h-4 w-4" />
                            Începe
                          </Button>
                        ) : null}

                        {status === "in_progress" ? (
                          <Button
                            type="button"
                            onClick={() => openResolveModal(issue)}
                            disabled={actionLoading}
                          >
                            <CheckCircle2 className="h-4 w-4" />
                            Rezolvă
                          </Button>
                        ) : null}
                      </div>
                    }
                  />
                );
              })}
            </div>
          </DataStateBoundary>
        </SectionCard>
      </div>

      <AppModal
        open={Boolean(scheduleIssue)}
        onClose={() => {
          if (!actionLoading) {
            setScheduleIssue(null);
          }
        }}
        title="Programează rezolvarea"
      >
        <div className="space-y-4">
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <p className="text-sm font-semibold text-white">
              {scheduleIssue ? buildVehicleTitle(scheduleIssue) : "—"}
            </p>

            <p className="mt-1 text-sm text-slate-300">
              {scheduleIssue ? getIssueSummary(scheduleIssue) : "—"}
            </p>
          </div>

          <FormField label="Data programării">
            <Input
              type="datetime-local"
              value={scheduledFor}
              onChange={(event) => {
                setScheduledFor(event.target.value);
                setActionError("");
              }}
              disabled={actionLoading}
            />
          </FormField>

          <FormField label="Mesaj pentru utilizator / locație">
            <Textarea
              value={scheduledLocation}
              onChange={(event) => {
                setScheduledLocation(event.target.value);
                setActionError("");
              }}
              placeholder="Ex: Mașina este programată mâine la ora 10:00 la service."
              disabled={actionLoading}
            />
          </FormField>

          {actionError ? (
            <p className="rounded-2xl border border-red-400/20 bg-red-500/10 px-4 py-3 text-sm font-semibold text-red-200">
              {actionError}
            </p>
          ) : null}

          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setScheduleIssue(null)}
              disabled={actionLoading}
            >
              Anulează
            </Button>

            <Button
              type="button"
              onClick={handleScheduleIssue}
              disabled={actionLoading}
              loading={actionLoading}
            >
              <CalendarDays className="h-4 w-4" />
              Salvează programarea
            </Button>
          </div>
        </div>
      </AppModal>

      <AppModal
        open={Boolean(resolveIssue)}
        onClose={() => {
          if (!actionLoading) {
            setResolveIssue(null);
          }
        }}
        title="Rezolvă problema"
      >
        <div className="space-y-4">
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <p className="text-sm font-semibold text-white">
              {resolveIssue ? buildVehicleTitle(resolveIssue) : "—"}
            </p>

            <p className="mt-1 text-sm text-slate-300">
              {resolveIssue ? getIssueSummary(resolveIssue) : "—"}
            </p>
          </div>

          <FormField label="Notițe rezolvare">
            <Textarea
              value={resolutionNotes}
              onChange={(event) => {
                setResolutionNotes(event.target.value);
                setActionError("");
              }}
              placeholder="Descrie lucrarea efectuată"
              disabled={actionLoading}
            />
          </FormField>

          <FormField label="Cost final">
            <Input
              value={finalCost}
              onChange={(event) => {
                setFinalCost(event.target.value);
                setActionError("");
              }}
              inputMode="decimal"
              placeholder="0"
              disabled={actionLoading}
            />
          </FormField>

          {actionError ? (
            <p className="rounded-2xl border border-red-400/20 bg-red-500/10 px-4 py-3 text-sm font-semibold text-red-200">
              {actionError}
            </p>
          ) : null}

          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setResolveIssue(null)}
              disabled={actionLoading}
            >
              Anulează
            </Button>

            <Button
              type="button"
              onClick={handleResolveIssue}
              disabled={actionLoading}
              loading={actionLoading}
            >
              <CheckCircle2 className="h-4 w-4" />
              Salvează rezolvarea
            </Button>
          </div>
        </div>
      </AppModal>
    </>
  );
}