"use client";

import { useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  AlertTriangle,
  ArrowLeft,
  CalendarDays,
  CarFront,
  Gauge,
  ShieldAlert,
  Wrench,
} from "lucide-react";

import DataStateBoundary from "@/components/patterns/data-state-boundary";
import InfoRow from "@/components/patterns/info-row";
import Button from "@/components/ui/button";
import SectionCard from "@/components/ui/section-card";
import StatusBadge from "@/components/ui/status-badge";
import { useMyIssues } from "@/hooks/issues/use-my-issues";

type Props = {
  issueId: number;
};

function getStatusLabel(status: string) {
  if (status === "scheduled") return "Programată";
  if (status === "in_progress") return "În lucru";
  if (status === "resolved") return "Rezolvată";
  if (status === "canceled") return "Anulată";
  return "Deschisă";
}

function getStatusVariant(status: string) {
  if (status === "scheduled") return "info";
  if (status === "in_progress") return "warning";
  if (status === "resolved") return "success";
  if (status === "canceled") return "neutral";
  return "danger";
}

function formatDate(value?: string | null) {
  if (!value) return "—";

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;

  return new Intl.DateTimeFormat("ro-RO", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(parsed);
}

export default function MyIssueDetailsScreen({ issueId }: Props) {
  const router = useRouter();
  const { data, loading, error } = useMyIssues();

  const issue = useMemo(
    () => data.find((item) => Number(item.id) === Number(issueId)) ?? null,
    [data, issueId]
  );

  return (
    <DataStateBoundary
      isLoading={loading}
      isError={Boolean(error)}
      errorMessage={error ?? "Nu s-a putut încărca problema."}
    >
      <div className="space-y-4">
        <Button
          type="button"
          variant="ghost"
          onClick={() => router.push("/employee/issues")}
          className="rounded-full border border-white/10 bg-white/10 px-4 py-2 text-white hover:bg-white/15"
        >
          <ArrowLeft className="h-4 w-4" />
          Înapoi
        </Button>

        {!issue ? (
          <SectionCard
            title="Problemă inexistentă"
            icon={<AlertTriangle className="h-5 w-5" />}
          >
            <p className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-slate-300">
              Problema selectată nu a fost găsită.
            </p>
          </SectionCard>
        ) : (
          <SectionCard
            title="Detalii problemă"
            icon={<AlertTriangle className="h-5 w-5" />}
          >
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
              <InfoRow
                icon={<ShieldAlert className="h-4 w-4" />}
                label="Status"
                value={
                  <StatusBadge
                    label={getStatusLabel(issue.status)}
                    variant={getStatusVariant(issue.status)}
                  />
                }
              />

              <InfoRow
                icon={<CarFront className="h-4 w-4" />}
                label="Vehicul"
                value={issue.vehicle_license_plate ?? "—"}
              />

              <InfoRow
                icon={<CalendarDays className="h-4 w-4" />}
                label="Creată la"
                value={formatDate(issue.created_at)}
              />

              <InfoRow
                icon={<ShieldAlert className="h-4 w-4" />}
                label="Prioritate"
                value={issue.priority ?? "medium"}
                valueClassName="capitalize"
              />
            </div>

            <div className="mt-4 grid gap-3 md:grid-cols-3">
              <InfoRow
                icon={<Wrench className="h-4 w-4" />}
                label="Frâne"
                value={issue.need_brakes ? "Da" : "Nu"}
              />

              <InfoRow
                icon={<Wrench className="h-4 w-4" />}
                label="Anvelope"
                value={issue.need_tires ? "Da" : "Nu"}
              />

              <InfoRow
                icon={<Wrench className="h-4 w-4" />}
                label="Ulei"
                value={issue.need_oil ? "Da" : "Nu"}
              />
            </div>

            <div className="mt-4 grid gap-3">
              {issue.need_service_in_km !== null ? (
                <InfoRow
                  icon={<Gauge className="h-4 w-4" />}
                  label="Service necesar în"
                  value={`${issue.need_service_in_km} km`}
                />
              ) : null}

              {issue.dashboard_checks ? (
                <InfoRow
                  icon={<AlertTriangle className="h-4 w-4" />}
                  label="Verificări / martori bord"
                  value={issue.dashboard_checks}
                />
              ) : null}

              {issue.other_problems ? (
                <InfoRow
                  icon={<Wrench className="h-4 w-4" />}
                  label="Alte probleme"
                  value={issue.other_problems}
                />
              ) : null}
            </div>
          </SectionCard>
        )}
      </div>
    </DataStateBoundary>
  );
}