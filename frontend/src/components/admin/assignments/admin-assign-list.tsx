"use client";

import { useMemo, useState } from "react";
import { CarFront, UserRound, ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";

import ConfirmDialog from "@/components/ui/confirm-dialog";
import DataStateBoundary from "@/components/patterns/data-state-boundary";
import Button from "@/components/ui/button";
import Card from "@/components/ui/card";
import SectionCard from "@/components/ui/section-card";

import { useAdminAssignments } from "@/hooks/admin/use-admin-assignments";
import { useSafeI18n } from "@/hooks/use-safe-i18n";

import { cn, formatDate } from "@/lib/utils";

import type { AssignmentItem } from "@/types/assignment.types";

export default function AdminAssignmentsListScreen() {
  const router = useRouter();
  const { t, locale } = useSafeI18n();

  const { assignments, loading, error, workingId, closeAssignmentAction } =
    useAdminAssignments({
      errorMessage: t("assignments", "failedToLoad"),
    });

  const activeAssignments = useMemo(
    () => assignments.filter((assignment) => assignment.status === "active"),
    [assignments]
  );

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [selected, setSelected] = useState<AssignmentItem | null>(null);

  function getStatusLabel(status: string) {
    if (status === "active") {
      return t("assignments", "active");
    }

    if (status === "closed") {
      return t("assignments", "closed");
    }

    return status;
  }

  function getStatusClass(status: string) {
    return status === "active"
      ? "border-emerald-200/25 bg-emerald-50 text-emerald-700"
      : "border-slate-200/20 bg-slate-200/70 text-slate-700";
  }

  return (
    <>
      <div className="space-y-5">
        <div className="flex items-center justify-start">
          <Button
            size="sm"
            variant="ghost"
            onClick={() => router.push("/admin/assignments")}
            className="rounded-full border border-white/10 bg-white/10 px-4 text-white hover:bg-white/15"
          >
            <ArrowLeft className="h-4 w-4" />
            {t("common", "back")}
          </Button>
        </div>

        <SectionCard title={t("assignments", "list")}>
          <DataStateBoundary
            isLoading={loading}
            isError={Boolean(error)}
            errorMessage={error ?? t("assignments", "failedToLoad")}
            isEmpty={activeAssignments.length === 0}
            emptyTitle={t("assignments", "noActive")}
          >
            <div className="space-y-2.5">
              {activeAssignments.map((assignment) => (
                <Card key={assignment.id} className="p-3">
                  <div className="grid gap-2 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-start lg:gap-3">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="min-w-0 flex flex-wrap items-center gap-1.5">
                          <p className="text-xs font-semibold text-white">
                            {assignment.user_name}
                          </p>

                          <span className="rounded-full border border-white/10 bg-white/10 px-2 py-0.5 text-[11px] font-medium text-slate-100">
                            {t("assignments", "shift")}{" "}
                            {assignment.shift_number}
                          </span>
                        </div>

                        <span
                          className={cn(
                            "rounded-full border px-2 py-0.5 text-[11px] font-medium",
                            getStatusClass(assignment.status)
                          )}
                        >
                          {getStatusLabel(assignment.status)}
                        </span>
                      </div>

                      <div className="mt-2 space-y-1 text-xs text-slate-300">
                        <p className="flex items-center gap-1.5">
                          <CarFront className="h-3.5 w-3.5 text-slate-400" />
                          <span>
                            {assignment.vehicle_license_plate || "—"}
                          </span>
                        </p>

                        <p className="flex items-center gap-1.5">
                          <UserRound className="h-3.5 w-3.5 text-slate-400" />
                          <span>
                            {formatDate(assignment.started_at, locale)}
                          </span>
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start justify-end">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          setSelected(assignment);
                          setConfirmOpen(true);
                        }}
                        disabled={workingId === assignment.id}
                        className="rounded-lg border border-white/12 bg-white/8 px-3 text-white shadow-none hover:bg-white/14"
                      >
                        {t("assignments", "closeAssignment")}
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </DataStateBoundary>
        </SectionCard>
      </div>

      <ConfirmDialog
        open={confirmOpen}
        title={t("assignments", "confirmation")}
        message={t("assignments", "releaseVehicleConfirm")}
        confirmText={t("assignments", "releaseVehicleConfirmButton")}
        cancelText={t("common", "cancel")}
        onCancel={() => {
          if (workingId !== null) return;
          setConfirmOpen(false);
          setSelected(null);
        }}
        onConfirm={async () => {
          if (!selected) return;

          await closeAssignmentAction(selected.id);
          setConfirmOpen(false);
          setSelected(null);
        }}
        loading={Boolean(workingId)}
      />
    </>
  );
}