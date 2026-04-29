"use client";

import { useRouter } from "next/navigation";
import { ArrowLeft, CarFront, ClipboardList, UserRound } from "lucide-react";

import DataStateBoundary from "@/components/patterns/data-state-boundary";
import ListChip from "@/components/patterns/list-chip";
import ListRow from "@/components/patterns/list-row";
import Button from "@/components/ui/button";
import ConfirmDialog from "@/components/ui/confirm-dialog";
import SectionCard from "@/components/ui/section-card";
import Select from "@/components/ui/select";
import StatusBadge from "@/components/ui/status-badge";
import {
  useAdminAssignVehicle,
  type VehicleLiveStatusItem,
} from "@/hooks/admin/use-admin-assign-vehicle";
import { useSafeI18n } from "@/hooks/use-safe-i18n";

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

  function getAvailabilityLabel(availability: string) {
    return availability === "occupied"
      ? t("vehicles", "occupied")
      : t("vehicles", "free");
  }

  function getAvailabilityChipVariant(availability: string) {
    return availability === "occupied" ? "blue" : "default";
  }

  function getAvailabilityBadgeVariant(availability: string) {
    return availability === "occupied" ? "info" : "neutral";
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
      <div className="space-y-6">
        <Button variant="back" onClick={() => router.push("/admin/dashboard")}>
          <ArrowLeft className="h-4 w-4" />
          {t("common", "back")}
        </Button>

        <SectionCard
          title={t("vehicles", "assignTitle")}
          icon={<ClipboardList className="h-5 w-5" />}
        >
          <DataStateBoundary
            isLoading={loading}
            isError={Boolean(error)}
            errorMessage={error ?? t("vehicles", "failedToLoad")}
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
                  <ListRow
                    key={vehicle.vehicle_id}
                    leading={<CarFront className="h-4 w-4" />}
                    title={`${vehicle.brand} ${vehicle.model}`}
                    subtitle={vehicle.license_plate}
                    badge={
                      <StatusBadge
                        label={getAvailabilityLabel(vehicle.availability)}
                        variant={getAvailabilityBadgeVariant(
                          vehicle.availability
                        )}
                      />
                    }
                    meta={
                      <>
                        <ListChip
                          icon={<CarFront className="h-3 w-3" />}
                          variant={getAvailabilityChipVariant(
                            vehicle.availability
                          )}
                        >
                          {t("vehicles", "availability")}:{" "}
                          {getAvailabilityLabel(vehicle.availability)}
                        </ListChip>

                        <ListChip icon={<UserRound className="h-3 w-3" />}>
                          {t("vehicles", "assignment")}:{" "}
                          {vehicle.assigned_to_name || t("vehicles", "nobody")}
                        </ListChip>
                      </>
                    }
                    actions={
                      <div className="w-full min-w-[220px] sm:w-[260px]">
                        <Select
                          value={selectedValue}
                          disabled={changingVehicleId === vehicle.vehicle_id}
                          onChange={(event) =>
                            openAllocationModal(vehicle, event.target.value)
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
                    }
                  />
                );
              })}
            </div>
          </DataStateBoundary>
        </SectionCard>
      </div>

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