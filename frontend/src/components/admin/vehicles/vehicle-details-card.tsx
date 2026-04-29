"use client";

import { CarFront, Trash2 } from "lucide-react";

import Button from "@/components/ui/button";
import StatusBadge from "@/components/ui/status-badge";
import ListChip from "@/components/patterns/list-chip";
import SectionCard from "@/components/ui/section-card";

import type { VehicleItem } from "@/types/vehicle.types";

type Props = {
  vehicle: VehicleItem;
  statusLabel: string;
  isRemoving: boolean;
  onRemove: () => void;
  labels: {
    title: string;
    brand: string;
    model: string;
    licensePlate: string;
    mileage: string;
    status: string;
    remove: string;
    removing: string;
  };
};

export default function VehicleDetailsCard({
  vehicle,
  statusLabel,
  isRemoving,
  onRemove,
  labels,
}: Props) {
  return (
    <SectionCard
      title={labels.title}
      icon={<CarFront className="h-5 w-5" />}
      actions={
        <Button
          type="button"
          size="sm"
          variant="danger"
          onClick={onRemove}
          disabled={isRemoving}
          loading={isRemoving}
        >
          <Trash2 className="h-4 w-4" />
          {isRemoving ? labels.removing : labels.remove}
        </Button>
      }
    >
      <div className="space-y-3">
        {/* Title */}
        <p className="text-base font-semibold text-white">
          {vehicle.brand} {vehicle.model}
        </p>

        {/* Status */}
        <StatusBadge label={statusLabel} variant="info" />

        {/* Meta chips */}
        <div className="flex flex-wrap gap-2">
          <ListChip icon={<CarFront className="h-3 w-3" />}>
            {labels.licensePlate}: {vehicle.license_plate}
          </ListChip>

          <ListChip>
            {labels.mileage}: {vehicle.current_mileage} km
          </ListChip>

          <ListChip>
            {labels.brand}: {vehicle.brand}
          </ListChip>

          <ListChip>
            {labels.model}: {vehicle.model}
          </ListChip>
        </div>
      </div>
    </SectionCard>
  );
}