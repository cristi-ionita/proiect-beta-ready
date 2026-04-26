"use client";

import { useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  AlertTriangle,
  CalendarDays,
  CarFront,
  ShieldAlert,
} from "lucide-react";

import DataStateBoundary from "@/components/patterns/data-state-boundary";
import SectionCard from "@/components/ui/section-card";
import StatusBadge from "@/components/ui/status-badge";
import { useMyIssues } from "@/hooks/issues/use-my-issues";

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

export default function MyIssuesScreen() {
  const router = useRouter();
  const { data, loading, error } = useMyIssues();

  const visibleIssues = useMemo(
    () => data.filter((issue) => Boolean(issue.vehicle_license_plate)),
    [data]
  );

  return (
    <DataStateBoundary
      isLoading={loading}
      isError={Boolean(error)}
      errorMessage={error ?? "Nu s-au putut încărca problemele."}
      isEmpty={visibleIssues.length === 0}
      emptyTitle="Nu ai raportat încă nicio problemă"
      emptyDescription="Dacă apar probleme la mașina alocată, le poți raporta din pagina de raportare."
    >
      <SectionCard
        title="Problemele mele"
        icon={<AlertTriangle className="h-5 w-5" />}
      >
        <div className="space-y-3">
          {visibleIssues.map((issue) => (
            <button
              key={issue.id}
              type="button"
              onClick={() => router.push(`/employee/issues/${issue.id}`)}
              className="block w-full rounded-2xl border border-white/10 bg-white/5 p-4 text-left transition hover:bg-white/10"
            >
              <div className="grid gap-3 md:grid-cols-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
                    <ShieldAlert className="h-4 w-4" />
                    Status
                  </div>

                  <StatusBadge
                    label={getStatusLabel(issue.status)}
                    variant={getStatusVariant(issue.status)}
                  />
                </div>

                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
                    <CalendarDays className="h-4 w-4" />
                    Creată la
                  </div>

                  <p className="text-sm font-semibold text-white">
                    {formatDate(issue.created_at)}
                  </p>
                </div>

                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
                    <CarFront className="h-4 w-4" />
                    Vehicul
                  </div>

                  <p className="text-sm font-semibold text-white">
                    {issue.vehicle_license_plate}
                  </p>
                </div>
              </div>
            </button>
          ))}
        </div>
      </SectionCard>
    </DataStateBoundary>
  );
}