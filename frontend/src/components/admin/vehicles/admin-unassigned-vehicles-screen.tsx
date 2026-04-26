"use client";

import { useRouter } from "next/navigation";
import { ArrowLeft, CarFront } from "lucide-react";

import DataStateBoundary from "@/components/patterns/data-state-boundary";
import Button from "@/components/ui/button";
import Card from "@/components/ui/card";
import SectionCard from "@/components/ui/section-card";

import { useAdminUnassignedVehicles } from "@/hooks/admin/use-admin-unassigned-vehicles";
import { useSafeI18n } from "@/hooks/use-safe-i18n";

import { cn } from "@/lib/utils";

export default function AdminUnassignedVehiclesScreen() {
  const router = useRouter();
  const { t } = useSafeI18n();

  const { unassignedVehicles, loading, error } = useAdminUnassignedVehicles();

  function getVehicleStatusLabel(status: string) {
    if (status === "in_service") return t("vehicles", "inService");
    if (status === "inactive") return t("vehicles", "inactive");
    if (status === "sold") return t("vehicles", "sold");

    return t("common", "active");
  }

  function getVehicleStatusClass(status: string) {
    if (status === "in_service") {
      return "border-amber-200 bg-amber-50 text-amber-700";
    }

    if (status === "inactive") {
      return "border-slate-200 bg-slate-100 text-slate-700";
    }

    if (status === "sold") {
      return "border-rose-200 bg-rose-50 text-rose-700";
    }

    return "border-emerald-200 bg-emerald-50 text-emerald-700";
  }

  return (
    <DataStateBoundary
      isLoading={loading}
      isError={Boolean(error)}
      errorMessage={error ?? t("vehicles", "failedToLoadAvailable")}
    >
      <div className="space-y-6">
        <div className="flex items-center justify-start">
          <Button
            variant="ghost"
            onClick={() => router.push("/admin/dashboard")}
            className="rounded-full border border-white/10 bg-white/10 px-4 py-2 text-white shadow-[0_10px_30px_rgba(0,0,0,0.16)] hover:bg-white/15"
          >
            <ArrowLeft className="h-4 w-4" />
            {t("common", "back")}
          </Button>
        </div>

        <SectionCard
          title={t("vehicles", "availableVehicles")}
          icon={<CarFront className="h-5 w-5" />}
        >
          <DataStateBoundary
            isEmpty={unassignedVehicles.length === 0}
            emptyTitle={t("vehicles", "noAvailableVehicles")}
          >
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {unassignedVehicles.map((vehicle) => (
                <Card key={vehicle.vehicle_id} className="p-4">
                  <div className="flex items-start gap-3">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[16px] bg-black text-white">
                      <CarFront className="h-5 w-5" />
                    </div>

                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-white">
                        {vehicle.brand} {vehicle.model}
                      </p>

                      <p className="mt-1 text-sm text-slate-400">
                        {vehicle.license_plate}
                      </p>

                      <span
                        className={cn(
                          "mt-3 inline-flex rounded-full border px-2.5 py-1 text-xs font-medium",
                          getVehicleStatusClass(vehicle.vehicle_status)
                        )}
                      >
                        {getVehicleStatusLabel(vehicle.vehicle_status)}
                      </span>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </DataStateBoundary>
        </SectionCard>
      </div>
    </DataStateBoundary>
  );
}