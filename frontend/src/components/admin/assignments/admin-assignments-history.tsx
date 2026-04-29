"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, CarFront, Clock, Settings2, UserRound } from "lucide-react";

import DataStateBoundary from "@/components/patterns/data-state-boundary";
import ListChip from "@/components/patterns/list-chip";
import ListRow from "@/components/patterns/list-row";
import Button from "@/components/ui/button";
import ConfirmDialog from "@/components/ui/confirm-dialog";
import SectionCard from "@/components/ui/section-card";
import StatusBadge from "@/components/ui/status-badge";
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

  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [assignmentToDelete, setAssignmentToDelete] =
    useState<AssignmentItem | null>(null);

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
        <Button
          variant="back"
          onClick={() => router.push("/admin/assignments")}
        >
          <ArrowLeft className="h-4 w-4" />
          {t("common", "back")}
        </Button>

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
                <ListRow
                  key={assignment.id}
                  leading={<UserRound className="h-4 w-4" />}
                  title={assignment.user_name || `#${assignment.user_id}`}
                  badge={
                    <StatusBadge
                      label={t("assignments", "closed")}
                      variant="neutral"
                    />
                  }
                  meta={
                    <>
                      <ListChip icon={<UserRound className="h-3 w-3" />}>
                        {t("assignments", "shift")}{" "}
                        {assignment.shift_number || "—"}
                      </ListChip>

                      <ListChip
                        icon={<CarFront className="h-3 w-3" />}
                        variant="blue"
                      >
                        {assignment.vehicle_license_plate ||
                          `#${assignment.vehicle_id}`}
                      </ListChip>

                      <ListChip icon={<Clock className="h-3 w-3" />}>
                        {t("assignments", "started")}:{" "}
                        {formatDate(assignment.started_at, locale)}
                      </ListChip>

                      <ListChip icon={<Settings2 className="h-3 w-3" />}>
                        {t("assignments", "closedLabel")}:{" "}
                        {formatDate(assignment.ended_at, locale)}
                      </ListChip>
                    </>
                  }
                  actions={
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
                  }
                />
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
        loading={isDeletingCurrent}
      />
    </>
  );
}