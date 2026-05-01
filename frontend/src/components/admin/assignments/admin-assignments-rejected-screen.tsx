"use client";

import { useMemo } from "react";
import { useRouter } from "next/navigation";
import { CarFront, Clock, UserRound, XCircle } from "lucide-react";

import DataStateBoundary from "@/components/patterns/data-state-boundary";
import ListChip from "@/components/patterns/list-chip";
import ListRow from "@/components/patterns/list-row";
import Button from "@/components/ui/button";
import SectionCard from "@/components/ui/section-card";
import StatusBadge from "@/components/ui/status-badge";
import { useAdminAssignments } from "@/hooks/admin/use-admin-assignments";
import { useSafeI18n } from "@/hooks/use-safe-i18n";
import { formatDate } from "@/lib/utils";

export default function AdminRejectedAssignmentsScreen() {
  const router = useRouter();
  const { t, locale } = useSafeI18n();

  const { assignments, loading, error } = useAdminAssignments({
    errorMessage: t("assignments", "failedToLoad"),
  });

  const rejectedAssignments = useMemo(
    () => assignments.filter((assignment) => assignment.status === "rejected"),
    [assignments]
  );

  return (
    <div className="space-y-4">
      <Button
        type="button"
        variant="back"
        onClick={() => router.push("/admin/assignments")}
      >
        {t("common", "back")}
      </Button>

      <SectionCard
        title={t("assignments", "rejected")}
        icon={<XCircle className="h-5 w-5" />}
      >
        <DataStateBoundary
          isLoading={loading}
          isError={Boolean(error)}
          errorMessage={error ?? t("assignments", "failedToLoad")}
          isEmpty={rejectedAssignments.length === 0}
          emptyTitle={t("assignments", "noRejected")}
        >
          <div className="space-y-2.5">
            {rejectedAssignments.map((assignment) => (
              <ListRow
                key={assignment.id}
                leading={<UserRound className="h-4 w-4" />}
                title={assignment.user_name || `#${assignment.user_id}`}
                badge={
                  <StatusBadge
                    label={t("assignments", "rejected")}
                    variant="danger"
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
                      {assignment.vehicle_brand} {assignment.vehicle_model} —{" "}
                      {assignment.vehicle_license_plate ||
                        `#${assignment.vehicle_id}`}
                    </ListChip>

                    <ListChip icon={<Clock className="h-3 w-3" />}>
                      {t("assignments", "rejectedAt")}:{" "}
                      {assignment.ended_at
                        ? formatDate(assignment.ended_at, locale)
                        : "—"}
                    </ListChip>
                  </>
                }
              />
            ))}
          </div>
        </DataStateBoundary>
      </SectionCard>
    </div>
  );
}