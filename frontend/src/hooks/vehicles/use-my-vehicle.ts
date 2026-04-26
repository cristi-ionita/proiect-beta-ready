"use client";

import { useEffect, useState } from "react";

import { isApiClientError } from "@/lib/api-error";
import { getMyVehicleDetails } from "@/services/vehicles.api";
import type { MyVehicleResponse } from "@/types/vehicle.types";

type UseMyVehicleResult = {
  data: MyVehicleResponse | null;
  loading: boolean;
  error: string;
  refetch: () => Promise<void>;
};

function getStatusCode(error: unknown): number | null {
  const err = error as {
    response?: {
      status?: number;
    };
    status?: number;
  };

  if (typeof err?.response?.status === "number") {
    return err.response.status;
  }

  if (typeof err?.status === "number") {
    return err.status;
  }

  return null;
}

export function useMyVehicle(): UseMyVehicleResult {
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
      const statusCode = getStatusCode(err);

      setData(null);

      if (statusCode === 400 || statusCode === 403 || statusCode === 404) {
        setError("");
      } else {
        setError(
          isApiClientError(err)
            ? err.message
            : "Nu am putut încărca vehiculul alocat."
        );
      }
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