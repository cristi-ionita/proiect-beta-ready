"use client";

import { useMemo, useState } from "react";
import { CarFront, ClipboardList, Users } from "lucide-react";

import DataStateBoundary from "@/components/patterns/data-state-boundary";
import Card from "@/components/ui/card";
import ConfirmDialog from "@/components/ui/confirm-dialog";
import SectionCard from "@/components/ui/section-card";

import { useAdminUsersData } from "@/hooks/admin/use-admin-users-data";
import { useActiveUsersTableData } from "@/hooks/users/use-active-users-table-data";
import { useSafeI18n } from "@/hooks/use-safe-i18n";

import { isApiClientError } from "@/lib/api-error";
import { updateUserShift } from "@/services/users.api";

export default function AdminUsersScreen() {
  const { t } = useSafeI18n();
  const { data, loading, error } = useAdminUsersData();

  const activeAssignments = useMemo(
    () =>
      data.assignments.filter((assignment) => assignment.status === "active"),
    [data.assignments]
  );

  const usersData = useActiveUsersTableData(
    data.users,
    data.leaveRequests,
    activeAssignments
  );

  const visibleUsers = useMemo(
    () => usersData.filter((user) => user.role !== "admin"),
    [usersData]
  );

  const [localShifts, setLocalShifts] = useState<Record<number, string>>({});
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  const [shiftValue, setShiftValue] = useState("");
  const [saving, setSaving] = useState(false);
  const [shiftError, setShiftError] = useState("");

  const selectedUser = visibleUsers.find((user) => user.id === selectedUserId);

  function getShift(userId: number, fallback: string | null) {
    return localShifts[userId] ?? fallback ?? "";
  }

  function openShiftDialog(userId: number, currentShift: string | null) {
    setSelectedUserId(userId);
    setShiftValue(getShift(userId, currentShift));
    setShiftError("");
  }

  function closeShiftDialog() {
    if (saving) return;

    setSelectedUserId(null);
    setShiftValue("");
    setShiftError("");
  }

  function isShiftTaken(shift: number) {
    return visibleUsers.some((user) => {
      if (user.id === selectedUserId) return false;

      const userShift = getShift(user.id, user.shift_number);
      return Number(userShift) === shift;
    });
  }

  async function saveShift() {
    if (!selectedUserId) return;

    const parsedShift = Number(shiftValue);

    if (!Number.isInteger(parsedShift) || parsedShift <= 0) {
      setShiftError(t("assignments", "shiftUnavailable"));
      return;
    }

    if (isShiftTaken(parsedShift)) {
      setShiftError(t("assignments", "shiftUnavailable"));
      return;
    }

    try {
      setSaving(true);
      setShiftError("");

      await updateUserShift(selectedUserId, parsedShift);

      setLocalShifts((current) => ({
        ...current,
        [selectedUserId]: String(parsedShift),
      }));

      closeShiftDialog();
    } catch (err) {
      setShiftError(
        isApiClientError(err)
          ? err.message
          : t("assignments", "shiftUnavailable")
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <DataStateBoundary
      isLoading={loading}
      isError={Boolean(error)}
      errorMessage={error ?? t("documents", "failedToLoadUsers")}
    >
      <div className="space-y-6">
        <SectionCard
          title={t("nav", "users")}
          actions={
            <div className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-700">
              <Users className="h-3.5 w-3.5" />
              {visibleUsers.length}
            </div>
          }
        >
          <DataStateBoundary
            isEmpty={visibleUsers.length === 0}
            emptyTitle={t("documents", "noUsersFound")}
          >
            <div className="space-y-3">
              {visibleUsers.map((user) => {
                const shift = getShift(user.id, user.shift_number);

                return (
                  <Card key={user.id} className="p-4">
                    <div className="flex min-w-0 flex-col gap-3">
                      <p className="truncate text-sm font-semibold text-white">
                        {user.full_name}
                      </p>

                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() =>
                            openShiftDialog(user.id, user.shift_number)
                          }
                          className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/10 px-3 py-1.5 text-xs font-medium text-slate-200 transition hover:bg-white/15"
                        >
                          <ClipboardList className="h-3.5 w-3.5 text-slate-300" />
                          {t("common", "shift")}: {shift || "—"}
                        </button>

                        <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/10 px-3 py-1.5 text-xs font-medium text-slate-200">
                          <CarFront className="h-3.5 w-3.5 text-slate-300" />
                          {t("common", "vehicle")}:{" "}
                          {user.vehicle_license_plate || "—"}
                        </span>
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          </DataStateBoundary>
        </SectionCard>
      </div>

      <ConfirmDialog
        open={Boolean(selectedUser)}
        title={`${t("common", "edit")} ${t("common", "shift")}`}
        message={selectedUser?.full_name ?? ""}
        confirmText={t("common", "save")}
        cancelText={t("common", "cancel")}
        loading={saving}
        loadingText={t("common", "loading")}
        onConfirm={saveShift}
        onCancel={closeShiftDialog}
      >
        <input
          autoFocus
          type="number"
          min="1"
          value={shiftValue}
          disabled={saving}
          onChange={(event) => {
            setShiftValue(event.target.value);
            setShiftError("");
          }}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              saveShift();
            }
          }}
          className="h-11 w-full rounded-xl border border-slate-200 px-4 text-sm text-slate-950 outline-none focus:border-slate-400"
        />

        {shiftError ? (
          <p className="mt-2 text-sm font-medium text-red-600">
            {shiftError}
          </p>
        ) : null}
      </ConfirmDialog>
    </DataStateBoundary>
  );
}