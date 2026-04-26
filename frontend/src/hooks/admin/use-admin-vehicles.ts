"use client";

import { useCallback, useEffect, useState } from "react";

import { listVehicles } from "@/services/vehicles.api";
import { isApiClientError } from "@/lib/api-error";
import type { VehicleItem } from "@/types/vehicle.types";

type UseAdminVehiclesResult = {
  vehicles: VehicleItem[];
  loading: boolean;
  error: string;
  refetch: () => Promise<void>;
};

export function useAdminVehicles(): UseAdminVehiclesResult {
  const [vehicles, setVehicles] = useState<VehicleItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    try {
      setLoading(true);
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
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  return {
    vehicles,
    loading,
    error,
    refetch: load,
  };
}