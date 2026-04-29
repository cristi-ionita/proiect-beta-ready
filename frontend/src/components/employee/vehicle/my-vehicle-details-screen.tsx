"use client";

import { useRouter } from "next/navigation";
import {
  Activity,
  ArrowLeft,
  CalendarDays,
  CarFront,
  Gauge,
} from "lucide-react";

import DataStateBoundary from "@/components/patterns/data-state-boundary";
import Button from "@/components/ui/button";
import SectionCard from "@/components/ui/section-card";
import { ROUTES } from "@/constants/routes";
import { useSafeI18n } from "@/hooks/use-safe-i18n";
import { useMyVehicle } from "@/hooks/vehicles/use-my-vehicle";

export default function MyVehicleDetailsScreen() {
  const router = useRouter();
  const { t, localeTag } = useSafeI18n();
  const { data, loading, error } = useMyVehicle();

  const isActiveAssignment = data?.assignment?.status === "active";
  const vehicle = isActiveAssignment ? data?.vehicle : null;

  function formatDate(value?: string | null) {
    if (!value) return "—";

    const parsed = new Date(value);

    if (Number.isNaN(parsed.getTime())) {
      return "—";
    }

    return new Intl.DateTimeFormat(localeTag, {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    }).format(parsed);
  }

  function getVehicleStatusLabel(status: string) {
    if (status === "available") return t("vehicles", "available");
    if (status === "assigned") return t("vehicles", "assigned");
    if (status === "in_service") return t("vehicles", "inService");
    if (status === "out_of_service") return t("vehicles", "outOfService");

    return status;
  }

  return (
    <DataStateBoundary
      isLoading={loading}
      isError={Boolean(error)}
      errorMessage={error ?? t("vehicles", "failedToLoad")}
    >
      <div className="space-y-4">
        <Button
          type="button"
          variant="ghost"
          onClick={() => router.push(ROUTES.EMPLOYEE.VEHICLE)}
          className="rounded-full border border-white/10 bg-white/10 px-4 py-2 text-white hover:bg-white/15"
        >
          <ArrowLeft className="h-4 w-4" />
          {t("common", "back")}
        </Button>

        {!vehicle ? (
          <SectionCard
            title={t("vehicles", "noActiveAssignment")}
            icon={<CarFront className="h-5 w-5" />}
          >
            <p className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-slate-300">
              {t("vehicles", "noActiveAssignment")}
            </p>
          </SectionCard>
        ) : (
          <SectionCard
            title={t("nav", "myVehicle")}
            icon={<CarFront className="h-5 w-5" />}
          >
            <div className="grid gap-3 md:grid-cols-2">
              <InfoItem
                label={t("vehicles", "licensePlate")}
                value={vehicle.license_plate}
                icon={<CarFront className="h-4 w-4" />}
                strong
              />

              <InfoItem
                label={t("vehicles", "brand")}
                value={vehicle.brand}
                icon={<CarFront className="h-4 w-4" />}
              />

              <InfoItem
                label={t("vehicles", "model")}
                value={vehicle.model}
                icon={<CarFront className="h-4 w-4" />}
              />

              <InfoItem
                label={t("vehicles", "currentMileage")}
                value={`${vehicle.current_mileage} km`}
                icon={<Gauge className="h-4 w-4" />}
              />

              <InfoItem
                label={t("common", "status")}
                value={getVehicleStatusLabel(vehicle.status)}
                icon={<Activity className="h-4 w-4" />}
              />

              <InfoItem
                label={t("vehicles", "createdAt")}
                value={formatDate(vehicle.created_at)}
                icon={<CalendarDays className="h-4 w-4" />}
              />
            </div>
          </SectionCard>
        )}
      </div>
    </DataStateBoundary>
  );
}

function InfoItem({
  label,
  value,
  icon,
  strong = false,
}: {
  label: string;
  value: string;
  icon: React.ReactNode;
  strong?: boolean;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
      <div className="mb-1 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
        {icon}
        {label}
      </div>

      <p
        className={
          strong
            ? "text-lg font-bold text-white"
            : "text-sm font-semibold text-white"
        }
      >
        {value}
      </p>
    </div>
  );
}