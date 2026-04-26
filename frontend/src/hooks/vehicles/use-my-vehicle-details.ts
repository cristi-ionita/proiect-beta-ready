"use client";

import { useEffect, useState } from "react";

import { isApiClientError } from "@/lib/api-error";
import { getMyVehicleDetails } from "@/services/vehicles.api";
import type { MyVehicleResponse } from "@/types/vehicle.types";

type UseMyVehicleDetailsResult = {
  data: MyVehicleResponse | null;
  loading: boolean;
  error: string;
  refetch: () => Promise<void>;
};

export function useMyVehicleDetails(): UseMyVehicleDetailsResult {
  const [data, setData] = useState<MyVehicleResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function load() {
    try {
      setLoading(true);
      setError("");

      const result = await getMyVehicleDetails();
      setData(result);
    } catch (err: unknown) {
      setData(null);
      setError(
        isApiClientError(err) ? err.message : "Could not load vehicle data."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  return {
    data,
    loading,
    error,
    refetch: load,
  };
}