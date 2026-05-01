"use client";

import { useMemo, useState } from "react";
import { CarFront, ClipboardList, UserRound, Users } from "lucide-react";

import DataStateBoundary from "@/components/patterns/data-state-boundary";
import ListChip from "@/components/patterns/list-chip";
import ListRow from "@/components/patterns/list-row";
import AppModal from "@/components/ui/app-modal";
import Button from "@/components/ui/button";
import Input from "@/components/ui/input";
import SectionCard from "@/components/ui/section-card";
import { useSafeI18n } from "@/hooks/use-safe-i18n";
import { useActiveUsersTableData } from "@/hooks/users/use-active-users-table-data";
import { useAdminUsersData } from "@/hooks/users/use-admin-users-data";
import { isApiClientError } from "@/lib/api-error";
import { getEmployeeProfile } from "@/services/profile.api";
import { updateUserShift } from "@/services/users.api";

type EmployeeProfile = {
  first_name?: string | null;
  last_name?: string | null;
  phone?: string | null;
  address?: string | null;
  iban?: string | null;
  emergency_contact_name?: string | null;
  emergency_contact_phone?: string | null;
};

type ModalView = "menu" | "profile" | "shift";

export default function AdminUsersScreen() {
  const { t } = useSafeI18n();
  const { data, loading, error } = useAdminUsersData();

  const activeAssignments = useMemo(
    () => data.assignments.filter((assignment) => assignment.status === "active"),
    [data.assignments]
  );

  const usersData = useActiveUsersTableData(
    data.users,
    data.leaveRequests,
    activeAssignments
  );

  const visibleUsers = useMemo(
    () => usersData.filter((user) => user.role === "employee"),
    [usersData]
  );

  const [localShifts, setLocalShifts] = useState<Record<number, string>>({});
  const [actionUserId, setActionUserId] = useState<number | null>(null);
  const [modalView, setModalView] = useState<ModalView>("menu");

  const [shiftValue, setShiftValue] = useState("");
  const [saving, setSaving] = useState(false);
  const [shiftError, setShiftError] = useState("");

  const [profileLoading, setProfileLoading] = useState(false);
  const [profileError, setProfileError] = useState("");
  const [profileData, setProfileData] = useState<EmployeeProfile | null>(null);

  const actionUser = visibleUsers.find((user) => user.id === actionUserId);

  function getShift(userId: number, fallback: string | null) {
    return localShifts[userId] ?? fallback ?? "";
  }

  function openActions(userId: number) {
    setActionUserId(userId);
    setModalView("menu");
    setShiftError("");
    setProfileError("");
    setProfileData(null);
  }

  function closeActions() {
    if (saving) return;

    setActionUserId(null);
    setModalView("menu");
    setShiftValue("");
    setShiftError("");
    setProfileError("");
    setProfileData(null);
    setProfileLoading(false);
  }

  function openShiftView() {
    if (!actionUser) return;

    setModalView("shift");
    setShiftValue(getShift(actionUser.id, actionUser.shift_number));
    setShiftError("");
  }

  async function openProfileView() {
    if (!actionUser) return;

    try {
      setModalView("profile");
      setProfileLoading(true);
      setProfileError("");
      setProfileData(null);

      const profile = await getEmployeeProfile(actionUser.id);
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

  function isShiftTaken(shift: number) {
    if (!actionUser) return false;

    return visibleUsers.some((user) => {
      if (user.id === actionUser.id) return false;
      return Number(getShift(user.id, user.shift_number)) === shift;
    });
  }

  async function saveShift() {
    if (!actionUser) return;

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

      await updateUserShift(actionUser.id, parsedShift);

      setLocalShifts((current) => ({
        ...current,
        [actionUser.id]: String(parsedShift),
      }));

      setModalView("menu");
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
    <div className="space-y-6">
      <SectionCard
        title={t("nav", "users")}
        actions={
          <ListChip icon={<Users className="h-3.5 w-3.5 shrink-0" />} variant="blue">
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
                  leading={<UserRound className="h-4 w-4 shrink-0" />}
                  title={user.full_name}
                  badge={
                    <span className="rounded-full bg-emerald-500/15 px-2.5 py-1 text-xs font-semibold text-emerald-300">
                      Activ
                    </span>
                  }
                  meta={
                    <>
                      <ListChip
                        icon={<ClipboardList className="h-3 w-3 shrink-0" />}
                        variant="blue"
                      >
                        {t("common", "shift")}: {shift || "—"}
                      </ListChip>

                      <ListChip icon={<CarFront className="h-3 w-3 shrink-0" />}>
                        {t("common", "vehicle")}:{" "}
                        {user.vehicle_license_plate || "—"}
                      </ListChip>
                    </>
                  }
                  onClick={() => openActions(user.id)}
                />
              );
            })}
          </div>
        </DataStateBoundary>
      </SectionCard>

      <AppModal
        open={Boolean(actionUser)}
        onClose={closeActions}
        title={actionUser?.full_name ?? t("nav", "users")}
        subtitle={
          modalView === "profile"
            ? "Date personale"
            : modalView === "shift"
              ? "Editează tură"
              : undefined
        }
      >
        {modalView === "menu" ? (
          <div className="space-y-4">
            <p className="text-sm text-slate-300">
              Alege acțiunea pentru acest utilizator.
            </p>

            <div className="grid gap-3 sm:grid-cols-2">
              <Button
                type="button"
                variant="secondary"
                className="w-full justify-center"
                onClick={() => void openProfileView()}
              >
                Date personale
              </Button>

              <Button
                type="button"
                variant="secondary"
                className="w-full justify-center"
                onClick={openShiftView}
              >
                Editează tură
              </Button>
            </div>
          </div>
        ) : null}

        {modalView === "profile" ? (
          <div className="space-y-4">
            <Button type="button" variant="ghost" size="sm" onClick={() => setModalView("menu")}>
              Înapoi
            </Button>

            {profileLoading ? (
              <p className="text-sm text-slate-300">Se încarcă...</p>
            ) : profileError ? (
              <p className="rounded-2xl border border-rose-400/30 bg-rose-500/10 px-4 py-3 text-sm font-semibold text-rose-200">
                {profileError}
              </p>
            ) : profileData ? (
              <div className="grid gap-3 md:grid-cols-2">
                <ProfileInfo label={t("profile", "firstName")} value={profileData.first_name} />
                <ProfileInfo label={t("profile", "lastName")} value={profileData.last_name} />
                <ProfileInfo label={t("profile", "phone")} value={profileData.phone} />
                <ProfileInfo label={t("profile", "address")} value={profileData.address} />
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
          </div>
        ) : null}

        {modalView === "shift" ? (
          <div className="space-y-4">
            <Button type="button" variant="ghost" size="sm" onClick={() => setModalView("menu")}>
              Înapoi
            </Button>

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

            <div className="grid grid-cols-2 gap-2">
              <Button
                type="button"
                variant="secondary"
                disabled={saving}
                onClick={() => setModalView("menu")}
              >
                {t("common", "cancel")}
              </Button>

              <Button type="button" disabled={saving} onClick={() => void saveShift()}>
                {saving ? t("common", "loading") : t("common", "save")}
              </Button>
            </div>
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