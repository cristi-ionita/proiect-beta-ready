"use client";

import { useEffect, useMemo, useState } from "react";
import {
  CarFront,
  ClipboardList,
  RefreshCw,
  Settings2,
  UserRound,
  Wrench,
} from "lucide-react";

import DataStateBoundary from "@/components/patterns/data-state-boundary";
import HeroStatCard from "@/components/patterns/hero-stat-card";
import InfoRow from "@/components/patterns/info-row";
import PageHero from "@/components/patterns/page-hero";
import Button from "@/components/ui/button";
import Card from "@/components/ui/card";

import { useSafeI18n } from "@/hooks/use-safe-i18n";
import { getVehicleLiveStatus } from "@/services/vehicles.api";
import { cn } from "@/lib/utils";

type VehicleLiveStatusItem = {
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
    return detail.map((item: { msg?: string }) => item?.msg || "Error").join(", ");
  }

  if (typeof detail === "object" && detail !== null && "msg" in detail) {
    return (detail as { msg?: string }).msg || "Error";
  }

  return "Failed to load live status.";
}

export default function AdminVehicleLiveStatusScreen() {
  const { t } = useSafeI18n();

  const [vehicles, setVehicles] = useState<VehicleLiveStatusItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  async function loadData(isRefresh = false) {
    try {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);

      setError("");

      const data = await getVehicleLiveStatus();
      setVehicles(Array.isArray(data) ? (data as VehicleLiveStatusItem[]) : []);
    } catch (err) {
      setError(extractErrorMessage(err));
      setVehicles([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    void loadData();
  }, []);

  const occupiedCount = useMemo(
    () => vehicles.filter((vehicle) => vehicle.availability === "occupied").length,
    [vehicles]
  );

  const freeCount = useMemo(
    () => vehicles.filter((vehicle) => vehicle.availability === "free").length,
    [vehicles]
  );

  const serviceCount = useMemo(
    () => vehicles.filter((vehicle) => vehicle.vehicle_status === "in_service").length,
    [vehicles]
  );

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

  return (
    <DataStateBoundary
      isLoading={loading}
      isError={Boolean(error)}
      errorMessage={error || t("vehicles", "failedToLoadLiveStatus")}
      isEmpty={!loading && !error && vehicles.length === 0}
      emptyTitle={t("vehicles", "noVehicles")}
    >
      <div className="space-y-6">
        <PageHero
          icon={<CarFront className="h-7 w-7" />}
          title={t("vehicles", "liveStatusTitle")}
          description={t("vehicles", "liveStatusDescription")}
          actions={
            <Button
              type="button"
              onClick={() => void loadData(true)}
              disabled={refreshing}
              className="rounded-full"
            >
              <RefreshCw
                className={cn("h-4 w-4", refreshing && "animate-spin")}
              />
              {refreshing ? t("common", "loading") : t("vehicles", "refresh")}
            </Button>
          }
          stats={
            <div className="grid w-full gap-3 sm:grid-cols-3">
              <HeroStatCard
                icon={<ClipboardList className="h-4 w-4" />}
                label={t("vehicles", "totalVehicles")}
                value={vehicles.length}
              />

              <HeroStatCard
                icon={<UserRound className="h-4 w-4" />}
                label={t("vehicles", "occupied")}
                value={occupiedCount}
              />

              <HeroStatCard
                icon={<Wrench className="h-4 w-4" />}
                label={t("vehicles", "inService")}
                value={`${serviceCount} / ${t("vehicles", "free")}: ${freeCount}`}
              />
            </div>
          }
        />

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {vehicles.map((vehicle) => (
            <Card key={vehicle.vehicle_id} className="p-5">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h2 className="truncate text-lg font-semibold text-white">
                    {vehicle.license_plate}
                  </h2>

                  <p className="mt-1 text-sm text-slate-400">
                    {vehicle.brand} {vehicle.model} • {vehicle.year}
                  </p>
                </div>

                <span
                  className={cn(
                    "shrink-0 rounded-full border px-3 py-1 text-xs font-medium",
                    getAvailabilityClass(vehicle.availability)
                  )}
                >
                  {getAvailabilityLabel(vehicle.availability)}
                </span>
              </div>

              <div className="mt-4 grid gap-3">
                <InfoRow
                  icon={<Settings2 className="h-4 w-4 text-slate-300" />}
                  label={t("common", "status")}
                  value={
                    <span
                      className={cn(
                        "rounded-full border px-2.5 py-1 text-xs font-medium",
                        getVehicleStatusClass(vehicle.vehicle_status)
                      )}
                    >
                      {getVehicleStatusLabel(vehicle.vehicle_status)}
                    </span>
                  }
                />

                <InfoRow
                  icon={<UserRound className="h-4 w-4 text-slate-300" />}
                  label={t("documents", "user")}
                  value={vehicle.assigned_to_name || "—"}
                />

                <InfoRow
                  icon={<ClipboardList className="h-4 w-4 text-slate-300" />}
                  label={t("common", "shift")}
                  value={vehicle.assigned_to_shift_number || "—"}
                />
              </div>

              {!vehicle.assigned_to_name ? (
                <div className="mt-4 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-400">
                  {t("vehicles", "noActiveAssignment")}
                </div>
              ) : null}
            </Card>
          ))}
        </section>
      </div>
    </DataStateBoundary>
  );
}