"use client";

import { useMemo, useState } from "react";
import type { FormEvent } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, CheckCircle2, ClipboardList } from "lucide-react";

import DataStateBoundary from "@/components/patterns/data-state-boundary";
import Alert from "@/components/ui/alert";
import Button from "@/components/ui/button";
import FormField from "@/components/ui/form-field";
import SectionCard from "@/components/ui/section-card";
import Select from "@/components/ui/select";
import { useAdminAssignments } from "@/hooks/admin/use-admin-assignments";
import { useSafeI18n } from "@/hooks/use-safe-i18n";

export default function AdminCreateAssignmentScreen() {
  const router = useRouter();
  const { t } = useSafeI18n();

  const fallback = "—";
  const loadErrorMessage = t("assignments", "failedToLoad");

  const { users, vehicles, createAssignmentAction, loading, saving, error } =
    useAdminAssignments({
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

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const parsedUserId = Number(userId);
    const parsedVehicleId = Number(vehicleId);

    if (!parsedUserId || !parsedVehicleId || !selectedUserShift) return;

    setSuccessMessage("");

    await createAssignmentAction(
      parsedUserId,
      parsedVehicleId,
      selectedUserShift
    );

    setUserId("");
    setVehicleId("");
    setSuccessMessage(t("assignments", "createSuccess"));
  }

  return (
    <div className="space-y-6">
      <Button
        variant="back"
        onClick={() => router.push("/admin/assignments")}
      >
        <ArrowLeft className="h-4 w-4" />
        {t("common", "back")}
      </Button>

      {successMessage ? (
        <Alert
          variant="success"
          message={successMessage}
          className="max-w-2xl"
        />
      ) : null}

      <SectionCard
        title={t("assignments", "create")}
        icon={<ClipboardList className="h-5 w-5" />}
      >
        <DataStateBoundary
          isLoading={loading}
          isError={Boolean(error)}
          errorMessage={error ?? loadErrorMessage}
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
                    {user.full_name} — {t("common", "shift")}:{" "}
                    {user.shift_number || fallback}
                  </option>
                ))}
              </Select>
            </FormField>

            {selectedUser ? (
              <Alert
                variant={selectedUserShift ? "info" : "warning"}
                message={`${t("common", "shift")}: ${
                  selectedUser.shift_number || fallback
                }`}
              />
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
                <CheckCircle2 className="h-4 w-4" />
                {t("assignments", "createButton")}
              </Button>
            </div>
          </form>
        </DataStateBoundary>
      </SectionCard>
    </div>
  );
}