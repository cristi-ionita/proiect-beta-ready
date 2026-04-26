"use client";

import { useRouter } from "next/navigation";
import { ArrowLeft, CarFront, ChevronDown, ClipboardList } from "lucide-react";

import ConfirmDialog from "@/components/ui/confirm-dialog";
import DataStateBoundary from "@/components/patterns/data-state-boundary";
import Button from "@/components/ui/button";
import SectionCard from "@/components/ui/section-card";
import Select from "@/components/ui/select";

import {
  useAdminAssignVehicle,
  type VehicleLiveStatusItem,
} from "@/hooks/admin/use-admin-assign-vehicle";
import { useSafeI18n } from "@/hooks/use-safe-i18n";

import { cn } from "@/lib/utils";

export default function AdminAssignVehicleScreen() {
  const router = useRouter();
  const { t } = useSafeI18n();

  const {
    vehicles,
    users,
    loading,
    changingVehicleId,
    selectedUserByVehicle,
    error,
    allocationModalOpen,
    vehicleToChange,
    nextAllocationValue,
    openAllocationModal,
    closeAllocationModal,
    handleConfirmAllocationChange,
  } = useAdminAssignVehicle();

  function getVehicleStatusLabel(status: string) {
    if (status === "in_service") return t("vehicles", "inService");
    if (status === "inactive") return t("vehicles", "inactive");
    if (status === "sold") return t("vehicles", "sold");
    return t("common", "active");
  }

  function getVehicleStatusClass(status: string) {
    if (status === "in_service") return "border-amber-200 bg-amber-50 text-amber-700";
    if (status === "inactive") return "border-slate-200 bg-slate-100 text-slate-700";
    if (status === "sold") return "border-rose-200 bg-rose-50 text-rose-700";
    return "border-emerald-200 bg-emerald-50 text-emerald-700";
  }

  function getAvailabilityLabel(availability: string) {
    return availability === "occupied"
      ? t("vehicles", "occupied")
      : t("vehicles", "free");
  }

  function getAvailabilityClass(availability: string) {
    return availability === "occupied"
      ? "border-blue-200 bg-blue-50 text-blue-700"
      : "border-slate-200 bg-white text-slate-700";
  }

  function getUserNameById(userId: string | null) {
    if (!userId || userId === "free") return t("vehicles", "free");

    const user = users.find((item) => String(item.id) === userId);
    return user?.full_name || userId;
  }

  function getAllocationMessage() {
    if (!vehicleToChange || !nextAllocationValue) {
      return t("vehicles", "confirmGeneric");
    }

    const currentUserName =
      vehicleToChange.assigned_to_name || t("vehicles", "nobody");

    const nextUserName = getUserNameById(nextAllocationValue);

    if (nextAllocationValue === "free") {
      return t("vehicles", "confirmFree")
        .replace("{plate}", vehicleToChange.license_plate)
        .replace("{user}", currentUserName);
    }

    if (vehicleToChange.availability === "occupied") {
      return t("vehicles", "confirmReassign")
        .replace("{plate}", vehicleToChange.license_plate)
        .replace("{from}", currentUserName)
        .replace("{to}", nextUserName);
    }

    return t("vehicles", "confirmAssign")
      .replace("{plate}", vehicleToChange.license_plate)
      .replace("{user}", nextUserName);
  }

  const isChangingCurrent =
    vehicleToChange !== null &&
    changingVehicleId === vehicleToChange.vehicle_id;

  return (
    <>
      <DataStateBoundary
        isLoading={loading}
        isError={Boolean(error)}
        errorMessage={error ?? t("vehicles", "failedToLoad")}
      >
        <div className="space-y-6">
          <Button
            variant="ghost"
            onClick={() => router.push("/admin/dashboard")}
          >
            <ArrowLeft className="h-4 w-4" />
            {t("common", "back")}
          </Button>

          <SectionCard
            title={t("vehicles", "assignTitle")}
            icon={<ClipboardList className="h-5 w-5" />}
          >
            <DataStateBoundary
              isEmpty={vehicles.length === 0}
              emptyTitle={t("vehicles", "noVehicles")}
            >
              <div className="space-y-3">
                {vehicles.map((vehicle: VehicleLiveStatusItem) => {
                  const selectedValue =
                    selectedUserByVehicle[vehicle.vehicle_id] ??
                    (vehicle.assigned_to_user_id
                      ? String(vehicle.assigned_to_user_id)
                      : "free");

                  return (
                    <div key={vehicle.vehicle_id} className="p-4 border rounded">
                      <p className="text-white font-semibold">
                        {vehicle.brand} {vehicle.model}
                      </p>

                      <Select
                        value={selectedValue}
                        onChange={(e) =>
                          openAllocationModal(vehicle, e.target.value)
                        }
                      >
                        <option value="free">{t("vehicles", "free")}</option>

                        {users.map((user) => (
                          <option key={user.id} value={user.id}>
                            {user.full_name}
                          </option>
                        ))}
                      </Select>
                    </div>
                  );
                })}
              </div>
            </DataStateBoundary>
          </SectionCard>
        </div>
      </DataStateBoundary>

      <ConfirmDialog
        open={allocationModalOpen}
        title={t("vehicles", "confirmTitle")}
        message={getAllocationMessage()}
        confirmText={t("common", "yes")}
        cancelText={t("common", "cancel")}
        loading={isChangingCurrent}
        loadingText={t("common", "loading")}
        onConfirm={handleConfirmAllocationChange}
        onCancel={closeAllocationModal}
      />
    </>
  );
}