"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, CheckCircle2, ClipboardList } from "lucide-react";

import DataStateBoundary from "@/components/patterns/data-state-boundary";
import Button from "@/components/ui/button";
import FormField from "@/components/ui/form-field";
import SectionCard from "@/components/ui/section-card";
import Select from "@/components/ui/select";

import { useAdminAssignments } from "@/hooks/admin/use-admin-assignments";
import { useSafeI18n } from "@/hooks/use-safe-i18n";

export default function AdminCreateAssignmentScreen() {
  const router = useRouter();
  const { t } = useSafeI18n();

  const loadErrorMessage = t("assignments", "failedToLoad");

  const {
    users,
    vehicles,
    createAssignmentAction,
    loading,
    saving,
    error,
  } = useAdminAssignments({
    errorMessage: loadErrorMessage,
  });

  const [userId, setUserId] = useState("");
  const [vehicleId, setVehicleId] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const selectedUser = useMemo(() => {
    const parsedUserId = Number(userId);
    return users.find((user) => user.id === parsedUserId) ?? null;
  }, [users, userId]);

  const selectedUserShift = selectedUser?.shift_number
    ? Number(selectedUser.shift_number)
    : 0;

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const parsedUserId = Number(userId);
    const parsedVehicleId = Number(vehicleId);

    if (!parsedUserId || !parsedVehicleId || !selectedUserShift) {
      return;
    }

    setSuccessMessage("");

    await createAssignmentAction(
      parsedUserId,
      parsedVehicleId,
      selectedUserShift
    );

    setUserId("");
    setVehicleId("");
    setSuccessMessage("Alocare creată cu succes.");
  }

  return (
    <DataStateBoundary
      isLoading={loading}
      isError={Boolean(error)}
      errorMessage={error ?? loadErrorMessage}
    >
      <div className="space-y-6">
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

        {successMessage ? (
          <div className="flex items-center gap-2 rounded-2xl border border-emerald-300/30 bg-emerald-500/10 px-4 py-3 text-sm font-semibold text-emerald-200">
            <CheckCircle2 className="h-4 w-4" />
            {successMessage}
          </div>
        ) : null}

        <SectionCard
          title={t("assignments", "create")}
          icon={<ClipboardList className="h-5 w-5" />}
        >
          <form onSubmit={handleSubmit} className="space-y-5">
            <FormField label={t("documents", "user")} required>
              <Select
                value={userId}
                onChange={(event) => {
                  setUserId(event.target.value);
                  setSuccessMessage("");
                }}
              >
                <option value="">{t("assignments", "selectUser")}</option>

                {users.map((user) => (
                  <option key={user.id} value={user.id}>
                    {user.full_name}
                    {user.shift_number
                      ? ` — ${t("common", "shift")}: ${user.shift_number}`
                      : ` — ${t("common", "shift")}: —`}
                  </option>
                ))}
              </Select>
            </FormField>

            {selectedUser ? (
              <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-200">
                {t("common", "shift")}:{" "}
                <span className="font-semibold text-white">
                  {selectedUser.shift_number || "—"}
                </span>
              </div>
            ) : null}

            <FormField label={t("common", "vehicle")} required>
              <Select
                value={vehicleId}
                onChange={(event) => {
                  setVehicleId(event.target.value);
                  setSuccessMessage("");
                }}
              >
                <option value="">{t("assignments", "selectVehicle")}</option>

                {vehicles.map((vehicle) => (
                  <option key={vehicle.id} value={vehicle.id}>
                    {vehicle.license_plate} — {vehicle.brand} {vehicle.model}
                  </option>
                ))}
              </Select>
            </FormField>

            <div className="flex justify-end">
              <Button
                type="submit"
                size="sm"
                disabled={saving || !userId || !vehicleId || !selectedUserShift}
                loading={saving}
              >
                {t("assignments", "createButton")}
              </Button>
            </div>
          </form>
        </SectionCard>
      </div>
    </DataStateBoundary>
  );
}