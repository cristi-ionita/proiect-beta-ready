"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, CarFront, Settings2, UserRound } from "lucide-react";

import ConfirmDialog from "@/components/ui/confirm-dialog";
import DataStateBoundary from "@/components/patterns/data-state-boundary";
import Button from "@/components/ui/button";
import Card from "@/components/ui/card";
import SectionCard from "@/components/ui/section-card";

import { useAdminAssignments } from "@/hooks/admin/use-admin-assignments";
import { useSafeI18n } from "@/hooks/use-safe-i18n";

import { formatDate } from "@/lib/utils";

import type { AssignmentItem } from "@/types/assignment.types";

export default function AdminAssignmentsHistoryScreen() {
  const router = useRouter();
  const { t, locale } = useSafeI18n();

  const { assignments, loading, error, workingId, deleteAssignmentAction } =
    useAdminAssignments({
      errorMessage: t("assignments", "failedToLoadHistory"),
    });

  const historyAssignments = useMemo(() => {
    return [...assignments]
      .filter((assignment) => assignment.status === "closed")
      .sort((a, b) => {
        const plateA = (a.vehicle_license_plate || "").toLocaleUpperCase();
        const plateB = (b.vehicle_license_plate || "").toLocaleUpperCase();

        const plateCompare = plateA.localeCompare(plateB, locale, {
          numeric: true,
          sensitivity: "base",
        });

        if (plateCompare !== 0) return plateCompare;

        const endedAtA = a.ended_at ? new Date(a.ended_at).getTime() : 0;
        const endedAtB = b.ended_at ? new Date(b.ended_at).getTime() : 0;

        return endedAtB - endedAtA;
      });
  }, [assignments, locale]);

  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [assignmentToDelete, setAssignmentToDelete] =
    useState<AssignmentItem | null>(null);

  const isDeletingCurrent =
    assignmentToDelete !== null && workingId === assignmentToDelete.id;

  const deleteMessage = assignmentToDelete
    ? `${t("assignments", "deleteHistoryConfirm")} ${
        assignmentToDelete.user_name || `#${assignmentToDelete.user_id}`
      }?`
    : "";

  return (
    <>
      <div className="space-y-5">
        <div className="flex items-center justify-start">
          <Button
            variant="ghost"
            onClick={() => router.push("/admin/assignments")}
            className="rounded-full border border-white/10 bg-white/10 px-4 py-2 text-white shadow-[0_10px_30px_rgba(0,0,0,0.16)] hover:bg-white/15"
          >
            <ArrowLeft className="h-4 w-4" />
            {t("common", "back")}
          </Button>
        </div>

        <SectionCard title={t("assignments", "history")}>
          <DataStateBoundary
            isLoading={loading}
            isError={Boolean(error)}
            errorMessage={error ?? t("assignments", "failedToLoadHistory")}
            isEmpty={historyAssignments.length === 0}
            emptyTitle={t("assignments", "noClosedHistory")}
          >
            <div className="space-y-2.5">
              {historyAssignments.map((assignment) => (
                <Card key={assignment.id} className="p-3">
                  <div className="grid gap-2 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-start lg:gap-3">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="min-w-0 flex flex-wrap items-center gap-1.5">
                          <p className="text-xs font-semibold text-white">
                            {assignment.user_name || `#${assignment.user_id}`}
                          </p>

                          <span className="rounded-full border border-white/10 bg-white/10 px-2 py-0.5 text-[11px] font-medium text-slate-100">
                            {t("assignments", "shift")}{" "}
                            {assignment.shift_number}
                          </span>
                        </div>

                        <span className="rounded-full border border-slate-200/20 bg-slate-200/70 px-2 py-0.5 text-[11px] font-medium text-slate-700">
                          {t("assignments", "closed")}
                        </span>
                      </div>

                      <div className="mt-2 space-y-1 text-xs text-slate-300">
                        <p className="flex items-center gap-1.5">
                          <CarFront className="h-3.5 w-3.5 text-slate-400" />
                          <span>
                            {assignment.vehicle_license_plate ||
                              `#${assignment.vehicle_id}`}
                          </span>
                        </p>

                        <p className="flex items-center gap-1.5">
                          <UserRound className="h-3.5 w-3.5 text-slate-400" />
                          <span>
                            {t("assignments", "started")}:{" "}
                            {formatDate(assignment.started_at, locale)}
                          </span>
                        </p>

                        <p className="flex items-center gap-1.5">
                          <Settings2 className="h-3.5 w-3.5 text-slate-400" />
                          <span>
                            {t("assignments", "closedLabel")}:{" "}
                            {formatDate(assignment.ended_at, locale)}
                          </span>
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start justify-end">
                      <Button
                        size="sm"
                        variant="danger"
                        onClick={() => {
                          setAssignmentToDelete(assignment);
                          setDeleteModalOpen(true);
                        }}
                        disabled={workingId === assignment.id}
                      >
                        {t("common", "delete")}
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
        open={deleteModalOpen}
        title={t("assignments", "deleteFromHistory")}
        message={deleteMessage}
        confirmText={t("common", "delete")}
        cancelText={t("common", "cancel")}
        onCancel={() => {
          if (workingId !== null) return;
          setDeleteModalOpen(false);
          setAssignmentToDelete(null);
        }}
        onConfirm={async () => {
          if (!assignmentToDelete) return;

          await deleteAssignmentAction(assignmentToDelete.id);
          setDeleteModalOpen(false);
          setAssignmentToDelete(null);
        }}
        loading={Boolean(isDeletingCurrent)}
      />
    </>
  );
}