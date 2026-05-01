"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { CarFront, Clock, UserRound } from "lucide-react";

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

export default function AdminAssignmentsListScreen() {
  const router = useRouter();
  const { t, locale } = useSafeI18n();

  const { assignments, loading, error, workingId, closeAssignmentAction } =
    useAdminAssignments({
      errorMessage: t("assignments", "failedToLoad"),
    });

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [selected, setSelected] = useState<AssignmentItem | null>(null);

  const activeAssignments = useMemo(
    () => assignments.filter((assignment) => assignment.status === "active"),
    [assignments]
  );

  const fallback = "—";

  return (
    <>
      <div className="space-y-5">
        <Button
          size="sm"
          variant="back"
          onClick={() => router.push("/admin/assignments")}
        >
          {t("common", "back")}
        </Button>

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
                <ListRow
                  key={assignment.id}
                  leading={<UserRound className="h-4 w-4" />}
                  title={assignment.user_name || fallback}
                  badge={
                    <StatusBadge
                      label={t("assignments", "active")}
                      variant="success"
                    />
                  }
                  meta={
                    <>
                      <ListChip icon={<UserRound className="h-3 w-3" />}>
                        {t("assignments", "shift")}{" "}
                        {assignment.shift_number || fallback}
                      </ListChip>

                      <ListChip
                        icon={<CarFront className="h-3 w-3" />}
                        variant="blue"
                      >
                        {assignment.vehicle_license_plate || fallback}
                      </ListChip>

                      <ListChip icon={<Clock className="h-3 w-3" />}>
                        {formatDate(assignment.started_at, locale)}
                      </ListChip>
                    </>
                  }
                  actions={
                    <Button
                    size="sm"
                    variant="danger"
                    onClick={() => {
                      setSelected(assignment);
                      setConfirmOpen(true);
                    }}
                    disabled={workingId === assignment.id}
                    >
                      {t("assignments", "closeAssignment")}
                      </Button>
                  }
                />
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