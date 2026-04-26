"use client";

import { useCallback, useEffect, useState } from "react";
import { getVehicleLiveStatus } from "@/services/vehicles.api";
import { useI18n } from "@/lib/i18n/use-i18n";

export type VehicleLiveStatusItem = {
  vehicle_id: number;
  license_plate: string;
  brand: string;
  model: string;
  year: number;
  availability: "free" | "occupied";
  vehicle_status: "active" | "in_service" | "inactive" | "sold";
  assigned_to_name?: string | null;
  assigned_to_shift_number?: string | null;
};

function extractErrorMessage(error: unknown): string {
  const err = error as {
    response?: { data?: { detail?: unknown } };
  };
  const detail = err?.response?.data?.detail;

  if (!detail) return "Failed to load live status.";
  if (typeof detail === "string") return detail;
  if (Array.isArray(detail)) {
    return detail
      .map((item: { msg?: string }) => item?.msg || "Error")
      .join(", ");
  }
  if (typeof detail === "object" && detail !== null && "msg" in detail) {
    return (detail as { msg?: string }).msg || "Error";
  }

  return "Failed to load live status.";
}

export function useAdminVehicleLiveStatus() {
  const { locale } = useI18n();

  const [vehicles, setVehicles] = useState<VehicleLiveStatusItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  function text(values: { ro: string; en: string; de: string }) {
    const safeLocale =
      locale === "ro" || locale === "en" || locale === "de" ? locale : "en";

    return values[safeLocale];
  }

  const load = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      setError("");

      const data = await getVehicleLiveStatus();
      const safeVehicles = Array.isArray(data) ? data : [];

      setVehicles(safeVehicles as VehicleLiveStatusItem[]);
    } catch (err) {
      setVehicles([]);
      setError(extractErrorMessage(err));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  return {
    vehicles,
    loading,
    refreshing,
    error,
    refetch: load,
    text,
  };
}