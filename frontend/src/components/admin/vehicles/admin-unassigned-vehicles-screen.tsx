"use client";

import { useRouter } from "next/navigation";
import { ArrowLeft, CarFront } from "lucide-react";

import DataStateBoundary from "@/components/patterns/data-state-boundary";
import ListRow from "@/components/patterns/list-row";
import Button from "@/components/ui/button";
import SectionCard from "@/components/ui/section-card";
import StatusBadge from "@/components/ui/status-badge";
import { useAdminUnassignedVehicles } from "@/hooks/admin/use-admin-unassigned-vehicles";
import { useSafeI18n } from "@/hooks/use-safe-i18n";

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

  function getVehicleStatusVariant(status: string) {
    if (status === "in_service") return "warning";
    if (status === "inactive") return "neutral";
    if (status === "sold") return "danger";

    return "success";
  }

  return (
    <div className="space-y-6">
      <Button variant="back" onClick={() => router.push("/admin/dashboard")}>
        <ArrowLeft className="h-4 w-4" />
        {t("common", "back")}
      </Button>

      <SectionCard
        title={t("vehicles", "availableVehicles")}
        icon={<CarFront className="h-5 w-5" />}
      >
        <DataStateBoundary
          isLoading={loading}
          isError={Boolean(error)}
          errorMessage={error ?? t("vehicles", "failedToLoadAvailable")}
          isEmpty={unassignedVehicles.length === 0}
          emptyTitle={t("vehicles", "noAvailableVehicles")}
        >
          <div className="space-y-3">
            {unassignedVehicles.map((vehicle) => (
              <ListRow
                key={vehicle.vehicle_id}
                leading={<CarFront className="h-4 w-4" />}
                title={`${vehicle.brand} ${vehicle.model}`}
                subtitle={vehicle.license_plate}
                badge={
                  <StatusBadge
                    label={getVehicleStatusLabel(vehicle.vehicle_status)}
                    variant={getVehicleStatusVariant(vehicle.vehicle_status)}
                  />
                }
              />
            ))}
          </div>
        </DataStateBoundary>
      </SectionCard>
    </div>
  );
}