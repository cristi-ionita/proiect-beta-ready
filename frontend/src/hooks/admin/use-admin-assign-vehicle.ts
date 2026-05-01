"use client";

import { useCallback, useEffect, useState } from "react";

import { closeAssignment, createAssignment } from "@/services/assignments.api";
import { listUsers } from "@/services/users.api";
import { getVehicleLiveStatus } from "@/services/vehicles.api";
import type { UserItem } from "@/types/user.types";
import type { VehicleLiveStatusItem } from "@/types/vehicle.types";

function extractErrorMessage(error: unknown): string {
  const err = error as {
    message?: string;
    response?: {
      data?: {
        detail?: string | Array<{ msg?: string }> | { msg?: string };
      };
    };
  };

  if (err?.message) return err.message;

  const detail = err?.response?.data?.detail;

  if (!detail) return "Failed to load assignment data.";
  if (typeof detail === "string") return detail;
  if (Array.isArray(detail)) {
    return detail.map((item) => item?.msg || "Error").join(", ");
  }
  if (typeof detail === "object") return detail.msg || "Error";

  return "Failed to load assignment data.";
}

type UseAdminAssignVehicleResult = {
  vehicles: VehicleLiveStatusItem[];
  users: UserItem[];
  loading: boolean;
  changingVehicleId: number | null;
  selectedUserByVehicle: Record<number, string>;
  error: string;
  allocationModalOpen: boolean;
  vehicleToChange: VehicleLiveStatusItem | null;
  nextAllocationValue: string | null;
  setError: (value: string) => void;
  openAllocationModal: (
    vehicle: VehicleLiveStatusItem,
    nextValue: string
  ) => void;
  closeAllocationModal: () => void;
  handleConfirmAllocationChange: () => Promise<void>;
  refetch: () => Promise<void>;
};

export function useAdminAssignVehicle(): UseAdminAssignVehicleResult {
  const [vehicles, setVehicles] = useState<VehicleLiveStatusItem[]>([]);
  const [users, setUsers] = useState<UserItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [changingVehicleId, setChangingVehicleId] = useState<number | null>(
    null
  );
  const [selectedUserByVehicle, setSelectedUserByVehicle] = useState<
    Record<number, string>
  >({});
  const [error, setError] = useState("");

  const [allocationModalOpen, setAllocationModalOpen] = useState(false);
  const [vehicleToChange, setVehicleToChange] =
    useState<VehicleLiveStatusItem | null>(null);
  const [nextAllocationValue, setNextAllocationValue] = useState<string | null>(
    null
  );

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const [liveResult, usersResult] = await Promise.allSettled([
        getVehicleLiveStatus(),
        listUsers(),
      ]);

      const safeLiveVehicles: VehicleLiveStatusItem[] =
        liveResult.status === "fulfilled" && Array.isArray(liveResult.value)
          ? liveResult.value
          : [];

      const safeUsers: UserItem[] =
        usersResult.status === "fulfilled" && Array.isArray(usersResult.value)
          ? usersResult.value
          : [];

      setVehicles(safeLiveVehicles);
      setUsers(
        safeUsers.filter(
          (user) =>
            user.is_active &&
            user.role === "employee" &&
            user.status === "approved"
        )
      );

      const initialSelections: Record<number, string> = {};

      safeLiveVehicles.forEach((vehicle) => {
        if (vehicle.availability === "occupied" && vehicle.assigned_to_user_id) {
          initialSelections[vehicle.vehicle_id] = String(
            vehicle.assigned_to_user_id
          );
        } else {
          initialSelections[vehicle.vehicle_id] = "free";
        }
      });

      setSelectedUserByVehicle(initialSelections);

      if (
        liveResult.status === "rejected" &&
        usersResult.status === "rejected"
      ) {
        setError(extractErrorMessage(liveResult.reason));
      }
    } catch (err) {
      setVehicles([]);
      setUsers([]);
      setSelectedUserByVehicle({});
      setError(extractErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  function openAllocationModal(
    vehicle: VehicleLiveStatusItem,
    nextValue: string
  ) {
    const currentAssignedUserId = vehicle.assigned_to_user_id
      ? String(vehicle.assigned_to_user_id)
      : "free";

    setSelectedUserByVehicle((prev) => ({
      ...prev,
      [vehicle.vehicle_id]: nextValue,
    }));

    if (nextValue === currentAssignedUserId) return;

    setVehicleToChange(vehicle);
    setNextAllocationValue(nextValue);
    setAllocationModalOpen(true);
    setError("");
  }

  function closeAllocationModal() {
    if (changingVehicleId !== null) return;

    if (vehicleToChange) {
      setSelectedUserByVehicle((prev) => ({
        ...prev,
        [vehicleToChange.vehicle_id]:
          vehicleToChange.availability === "occupied" &&
          vehicleToChange.assigned_to_user_id
            ? String(vehicleToChange.assigned_to_user_id)
            : "free",
      }));
    }

    setAllocationModalOpen(false);
    setVehicleToChange(null);
    setNextAllocationValue(null);
  }

  async function handleConfirmAllocationChange() {
    if (!vehicleToChange || !nextAllocationValue) return;

    try {
      setChangingVehicleId(vehicleToChange.vehicle_id);
      setError("");

      if (nextAllocationValue === "free") {
        if (vehicleToChange.active_assignment_id) {
          await closeAssignment(vehicleToChange.active_assignment_id);
        }
      } else {
        const nextUserId = Number(nextAllocationValue);

        if (!nextUserId) return;

        const nextUser = users.find((user) => user.id === nextUserId);
        const nextUserShiftNumber = Number(nextUser?.shift_number);

        if (
          !Number.isInteger(nextUserShiftNumber) ||
          nextUserShiftNumber <= 0
        ) {
          throw new Error("Utilizatorul selectat nu are tură validă.");
        }

        if (vehicleToChange.active_assignment_id) {
          await closeAssignment(vehicleToChange.active_assignment_id);
        }

        await createAssignment({
          user_id: nextUserId,
          vehicle_id: vehicleToChange.vehicle_id,
          shift_number: nextUserShiftNumber,
        });
      }

      await loadData();

      setAllocationModalOpen(false);
      setVehicleToChange(null);
      setNextAllocationValue(null);
    } catch (err) {
      setError(extractErrorMessage(err));

      if (vehicleToChange) {
        setSelectedUserByVehicle((prev) => ({
          ...prev,
          [vehicleToChange.vehicle_id]:
            vehicleToChange.availability === "occupied" &&
            vehicleToChange.assigned_to_user_id
              ? String(vehicleToChange.assigned_to_user_id)
              : "free",
        }));
      }
    } finally {
      setChangingVehicleId(null);
    }
  }

  return {
    vehicles,
    users,
    loading,
    changingVehicleId,
    selectedUserByVehicle,
    error,
    allocationModalOpen,
    vehicleToChange,
    nextAllocationValue,
    setError,
    openAllocationModal,
    closeAllocationModal,
    handleConfirmAllocationChange,
    refetch: loadData,
  };
}