"use client";

import { useRouter } from "next/navigation";
import { ArrowLeft, CarFront } from "lucide-react";

import DataStateBoundary from "@/components/patterns/data-state-boundary";
import Button from "@/components/ui/button";
import SectionCard from "@/components/ui/section-card";
import { ROUTES } from "@/constants/routes";
import { useMyVehicle } from "@/hooks/vehicles/use-my-vehicle";

export default function MyVehicleDetailsScreen() {
  const router = useRouter();
  const { data, loading, error } = useMyVehicle();

  const isActiveAssignment = data?.assignment?.status === "active";
  const vehicle = isActiveAssignment ? data?.vehicle : null;

  return (
    <DataStateBoundary
      isLoading={loading}
      isError={Boolean(error)}
      errorMessage={error ?? "Nu s-a putut încărca vehiculul."}
    >
      <div className="space-y-4">
        <Button
          type="button"
          variant="ghost"
          onClick={() => router.push(ROUTES.EMPLOYEE.VEHICLE)}
          className="rounded-full border border-white/10 bg-white/10 px-4 py-2 text-white hover:bg-white/15"
        >
          <ArrowLeft className="h-4 w-4" />
          Înapoi
        </Button>

        {!vehicle ? (
          <SectionCard
            title="Nu există vehicul activ"
            icon={<CarFront className="h-5 w-5" />}
          >
            <p className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-slate-300">
              Vehiculul va apărea aici doar după ce confirmi alocarea.
            </p>
          </SectionCard>
        ) : (
          <SectionCard
            title="Vehiculul meu"
            icon={<CarFront className="h-5 w-5" />}
          >
            <div className="flex items-center justify-between gap-4 rounded-2xl border border-white/10 bg-white/5 px-4 py-4">
              <span className="text-lg font-semibold text-white">
                {vehicle.license_plate}
              </span>

              <span className="text-sm font-medium text-slate-300">
                {vehicle.brand}
              </span>
            </div>
          </SectionCard>
        )}
      </div>
    </DataStateBoundary>
  );
}