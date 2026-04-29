"use client";

import { useMemo, useState } from "react";
import { CarFront, ClipboardList, UserRound, Users } from "lucide-react";

import DataStateBoundary from "@/components/patterns/data-state-boundary";
import ListChip from "@/components/patterns/list-chip";
import ListRow from "@/components/patterns/list-row";
import AppModal from "@/components/ui/app-modal";
import Button from "@/components/ui/button";
import ConfirmDialog from "@/components/ui/confirm-dialog";
import Input from "@/components/ui/input";
import SectionCard from "@/components/ui/section-card";
import { useSafeI18n } from "@/hooks/use-safe-i18n";
import { isApiClientError } from "@/lib/api-error";
import { getEmployeeProfile } from "@/services/profile.api";
import { updateUserShift } from "@/services/users.api";
import { useActiveUsersTableData } from "@/hooks/users/use-active-users-table-data";
import { useAdminUsersData } from "@/hooks/users/use-admin-users-data";

type EmployeeProfile = {
  first_name?: string | null;
  last_name?: string | null;
  phone?: string | null;
  address?: string | null;
  iban?: string | null;
  emergency_contact_name?: string | null;
  emergency_contact_phone?: string | null;
};

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

  const [profileOpen, setProfileOpen] = useState(false);
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileError, setProfileError] = useState("");
  const [profileData, setProfileData] = useState<EmployeeProfile | null>(null);
  const [profileUserName, setProfileUserName] = useState("");

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

  function closeProfileModal() {
    setProfileOpen(false);
    setProfileLoading(false);
    setProfileError("");
    setProfileData(null);
    setProfileUserName("");
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

  async function openProfileModal(userId: number, userName: string) {
    try {
      setProfileOpen(true);
      setProfileLoading(true);
      setProfileError("");
      setProfileData(null);
      setProfileUserName(userName);

      const profile = await getEmployeeProfile(userId);
      setProfileData(profile);
    } catch (err) {
      setProfileError(
        isApiClientError(err)
          ? err.message
          : "Nu s-au putut încărca datele personale."
      );
    } finally {
      setProfileLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <SectionCard
        title={t("nav", "users")}
        actions={
          <ListChip icon={<Users className="h-3.5 w-3.5" />} variant="blue">
            {visibleUsers.length}
          </ListChip>
        }
      >
        <DataStateBoundary
          isLoading={loading}
          isError={Boolean(error)}
          errorMessage={error ?? t("documents", "failedToLoadUsers")}
          isEmpty={visibleUsers.length === 0}
          emptyTitle={t("documents", "noUsersFound")}
        >
          <div className="space-y-3">
            {visibleUsers.map((user) => {
              const shift = getShift(user.id, user.shift_number);

              return (
                <ListRow
                  key={user.id}
                  leading={<UserRound className="h-4 w-4" />}
                  title={user.full_name}
                  meta={
                    <>
                      <button
                        type="button"
                        onClick={() =>
                          openShiftDialog(user.id, user.shift_number)
                        }
                      >
                        <ListChip
                          icon={<ClipboardList className="h-3 w-3" />}
                          variant="blue"
                        >
                          {t("common", "shift")}: {shift || "—"}
                        </ListChip>
                      </button>

                      <ListChip icon={<CarFront className="h-3 w-3" />}>
                        {t("common", "vehicle")}:{" "}
                        {user.vehicle_license_plate || "—"}
                      </ListChip>
                    </>
                  }
                  actions={
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() =>
                        void openProfileModal(user.id, user.full_name)
                      }
                    >
                      <UserRound className="h-4 w-4" />
                      Date personale
                    </Button>
                  }
                />
              );
            })}
          </div>
        </DataStateBoundary>
      </SectionCard>

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
        <div className="space-y-2">
          <Input
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
                void saveShift();
              }
            }}
          />

          {shiftError ? (
            <p className="text-sm font-medium text-rose-400">{shiftError}</p>
          ) : null}
        </div>
      </ConfirmDialog>

      <AppModal
        open={profileOpen}
        onClose={closeProfileModal}
        title={profileUserName}
        subtitle="Date personale"
        loading={profileLoading}
        error={profileError}
      >
        {profileData ? (
          <div className="grid gap-3 md:grid-cols-2">
            <ProfileInfo
              label={t("profile", "firstName")}
              value={profileData.first_name}
            />
            <ProfileInfo
              label={t("profile", "lastName")}
              value={profileData.last_name}
            />
            <ProfileInfo
              label={t("profile", "phone")}
              value={profileData.phone}
            />
            <ProfileInfo
              label={t("profile", "address")}
              value={profileData.address}
            />
            <ProfileInfo label="IBAN" value={profileData.iban} />
            <ProfileInfo
              label={t("profile", "emergencyContactName")}
              value={profileData.emergency_contact_name}
            />
            <ProfileInfo
              label={t("profile", "emergencyContactPhone")}
              value={profileData.emergency_contact_phone}
            />
          </div>
        ) : null}
      </AppModal>
    </div>
  );
}

function ProfileInfo({
  label,
  value,
}: {
  label: string;
  value?: string | null;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/10 p-4">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
        {label}
      </p>

      <p className="mt-2 break-words text-sm font-semibold text-white">
        {value || "—"}
      </p>
    </div>
  );
}