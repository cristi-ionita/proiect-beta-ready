"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import { getVehicleLiveStatus } from "@/services/vehicles.api";
import { isApiClientError } from "@/lib/api-error";

type VehicleLiveStatusItem = {
  vehicle_id: number;
  brand: string;
  model: string;
  license_plate: string;
  vehicle_status: string;
  assigned_to_user_id?: number | null;
  active_assignment_id?: number | null;
};

type UseAdminUnassignedVehiclesResult = {
  vehicles: VehicleLiveStatusItem[];
  unassignedVehicles: VehicleLiveStatusItem[];
  loading: boolean;
  refreshing: boolean;
  error: string;
  refetch: () => Promise<void>;
  refresh: () => Promise<void>;
};

export function useAdminUnassignedVehicles(): UseAdminUnassignedVehiclesResult {
  const [vehicles, setVehicles] = useState<VehicleLiveStatusItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      setError("");

      const data = await getVehicleLiveStatus();
      const safeVehicles = Array.isArray(data)
        ? data
        : [];

      setVehicles(safeVehicles as VehicleLiveStatusItem[]);
    } catch (err: unknown) {
      setVehicles([]);
      setError(
        isApiClientError(err) && typeof err.message === "string"
          ? err.message
          : "Failed to load vehicles."
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const unassignedVehicles = useMemo(() => {
    return vehicles.filter(
      (vehicle) =>
        vehicle.assigned_to_user_id === null &&
        vehicle.active_assignment_id === null
    );
  }, [vehicles]);

  const refetch = useCallback(async () => {
    await load(false);
  }, [load]);

  const refresh = useCallback(async () => {
    await load(true);
  }, [load]);

  return {
    vehicles,
    unassignedVehicles,
    loading,
    refreshing,
    error,
    refetch,
    refresh,
  };
}