"use client";

import { useCallback, useEffect, useState } from "react";

import { listVehicles } from "@/services/vehicles.api";
import { isApiClientError } from "@/lib/api-error";
import type { VehicleItem } from "@/types/vehicle.types";

type UseAdminVehiclesListResult = {
  vehicles: VehicleItem[];
  loading: boolean;
  refreshing: boolean;
  error: string;
  refetch: () => Promise<void>;
  refresh: () => Promise<void>;
};

export function useAdminVehiclesList(): UseAdminVehiclesListResult {
  const [vehicles, setVehicles] = useState<VehicleItem[]>([]);
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

      const data = await listVehicles();
      setVehicles(Array.isArray(data) ? data : []);
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

  const refetch = useCallback(async () => {
    await load(false);
  }, [load]);

  const refresh = useCallback(async () => {
    await load(true);
  }, [load]);

  return {
    vehicles,
    loading,
    refreshing,
    error,
    refetch,
    refresh,
  };
}