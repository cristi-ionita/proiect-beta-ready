"use client";

import { useRouter } from "next/navigation";
import { ArrowLeft, CarFront } from "lucide-react";

import DataStateBoundary from "@/components/patterns/data-state-boundary";
import Button from "@/components/ui/button";
import Card from "@/components/ui/card";
import SectionCard from "@/components/ui/section-card";

import { useAdminVehiclesList } from "@/hooks/vehicles/use-admin-vehicles-list";
import { useSafeI18n } from "@/hooks/use-safe-i18n";

import { cn } from "@/lib/utils";

import type { VehicleItem } from "@/types/vehicle.types";

export default function AdminVehiclesListScreen() {
  const router = useRouter();
  const { t } = useSafeI18n();

  const { vehicles, loading, error } = useAdminVehiclesList();

  function getStatusLabel(status: string) {
    if (status === "available") return t("vehicles", "available");
    if (status === "assigned") return t("vehicles", "assigned");
    if (status === "in_service") return t("vehicles", "inService");
    if (status === "out_of_service") return t("vehicles", "outOfService");
    if (status === "inactive") return t("vehicles", "inactive");
    if (status === "sold") return t("vehicles", "sold");

    return t("common", "active");
  }

  function getStatusClass(status: string) {
    if (status === "available") {
      return "border-emerald-300/30 bg-emerald-400/15 text-emerald-200";
    }

    if (status === "assigned") {
      return "border-blue-300/30 bg-blue-400/15 text-blue-200";
    }

    if (status === "in_service") {
      return "border-amber-300/30 bg-amber-400/15 text-amber-200";
    }

    if (status === "out_of_service") {
      return "border-rose-300/30 bg-rose-400/15 text-rose-200";
    }

    if (status === "inactive") {
      return "border-slate-300/20 bg-slate-400/15 text-slate-200";
    }

    if (status === "sold") {
      return "border-rose-300/30 bg-rose-400/15 text-rose-200";
    }

    return "border-emerald-300/30 bg-emerald-400/15 text-emerald-200";
  }

  return (
    <DataStateBoundary
      isLoading={loading}
      isError={Boolean(error)}
      errorMessage={error ?? t("vehicles", "failedToLoad")}
    >
      <div className="space-y-6">
        <div className="flex items-center justify-start">
          <Button
            size="sm"
            variant="ghost"
            onClick={() => router.push("/admin/vehicles")}
            className="rounded-full border border-white/10 bg-white/10 px-4 text-white hover:bg-white/15"
          >
            <ArrowLeft className="h-4 w-4" />
            {t("common", "back")}
          </Button>
        </div>

        <SectionCard title={t("vehicles", "listTitle")}>
          <DataStateBoundary
            isEmpty={vehicles.length === 0}
            emptyTitle={t("vehicles", "noVehicles")}
          >
            <div className="space-y-3">
              {vehicles.map((vehicle: VehicleItem) => (
                <button
                  key={vehicle.id}
                  type="button"
                  onClick={() => router.push(`/admin/vehicles/${vehicle.id}`)}
                  className="block w-full text-left"
                >
                  <Card className="w-full rounded-2xl border border-white/10 bg-white/10 p-4 transition hover:bg-white/15">
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex min-w-0 items-center gap-4">
                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-black text-white">
                          <CarFront className="h-5 w-5" />
                        </div>

                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold text-white">
                            {vehicle.brand} {vehicle.model}
                          </p>

                          <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-300">
                            <span>{vehicle.license_plate}</span>

                            <span>
                              {t("vehicles", "year")}: {vehicle.year}
                            </span>

                            {vehicle.vin ? (
                              <span className="max-w-[360px] truncate">
                                {t("vehicles", "vin")}: {vehicle.vin}
                              </span>
                            ) : null}
                          </div>
                        </div>
                      </div>

                      <span
                        className={cn(
                          "shrink-0 rounded-full border px-3 py-1 text-xs font-semibold",
                          getStatusClass(vehicle.status)
                        )}
                      >
                        {getStatusLabel(vehicle.status)}
                      </span>
                    </div>
                  </Card>
                </button>
              ))}
            </div>
          </DataStateBoundary>
        </SectionCard>
      </div>
    </DataStateBoundary>
  );
}