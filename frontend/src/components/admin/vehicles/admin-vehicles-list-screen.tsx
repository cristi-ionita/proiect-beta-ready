"use client";

import { useRouter } from "next/navigation";
import { ArrowLeft, CalendarDays, CarFront } from "lucide-react";

import DataStateBoundary from "@/components/patterns/data-state-boundary";
import ListChip from "@/components/patterns/list-chip";
import ListRow from "@/components/patterns/list-row";
import Button from "@/components/ui/button";
import SectionCard from "@/components/ui/section-card";
import StatusBadge from "@/components/ui/status-badge";
import { useAdminVehiclesList } from "@/hooks/admin/use-admin-vehicles-list";
import { useSafeI18n } from "@/hooks/use-safe-i18n";
import type { VehicleItem } from "@/types/vehicle.types";

export default function AdminVehiclesListScreen() {
  const router = useRouter();
  const { t, localeTag } = useSafeI18n();

  const { vehicles, loading, error } = useAdminVehiclesList();

  function formatCreatedAt(value: string | Date) {
    return new Intl.DateTimeFormat(localeTag, {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    }).format(new Date(value));
  }

  function getStatusLabel(status: string) {
    if (status === "available") return t("vehicles", "available");
    if (status === "assigned") return t("vehicles", "assigned");
    if (status === "in_service") return t("vehicles", "inService");
    if (status === "out_of_service") return t("vehicles", "outOfService");

    return t("common", "active");
  }

  function getStatusVariant(status: string) {
    if (status === "available") return "success";
    if (status === "assigned") return "info";
    if (status === "in_service") return "warning";
    if (status === "out_of_service") return "danger";

    return "neutral";
  }

  return (
    <div className="space-y-6">
      <Button
        size="sm"
        variant="back"
        onClick={() => router.push("/admin/vehicles")}
      >
        <ArrowLeft className="h-4 w-4" />
        {t("common", "back")}
      </Button>

      <SectionCard title={t("vehicles", "listTitle")}>
        <DataStateBoundary
          isLoading={loading}
          isError={Boolean(error)}
          errorMessage={error ?? t("vehicles", "failedToLoad")}
          isEmpty={vehicles.length === 0}
          emptyTitle={t("vehicles", "noVehicles")}
        >
          <div className="space-y-3">
            {vehicles.map((vehicle: VehicleItem) => (
              <ListRow
                key={vehicle.id}
                leading={<CarFront className="h-4 w-4" />}
                title={`${vehicle.brand} ${vehicle.model}`}
                subtitle={vehicle.license_plate}
                badge={
                  <StatusBadge
                    label={getStatusLabel(vehicle.status)}
                    variant={getStatusVariant(vehicle.status)}
                  />
                }
                meta={
                  <ListChip icon={<CalendarDays className="h-3 w-3" />}>
                    {t("vehicles", "createdAt")}:{" "}
                    {formatCreatedAt(vehicle.created_at)}
                  </ListChip>
                }
                onClick={() => router.push(`/admin/vehicles/${vehicle.id}`)}
              />
            ))}
          </div>
        </DataStateBoundary>
      </SectionCard>
    </div>
  );
}