import type { VehicleItem } from "@/types/vehicle.types";

export type VehicleWithAssignmentInfo = VehicleItem & {
  assigned_to_shift_number?: string | number | null;
  assigned_shift_number?: string | number | null;
  shift_number?: string | number | null;
  assignment?: {
    shift_number?: string | number | null;
  } | null;
};

function normalizeShiftNumber(value: string | number | null | undefined): string | null {
  if (value === null || value === undefined) return null;

  const normalized = String(value).trim();

  return normalized.length > 0 ? normalized : null;
}

export function getVehicleAssignedShiftNumber(vehicle: VehicleItem): string | null {
  const vehicleWithAssignment = vehicle as VehicleWithAssignmentInfo;

  return normalizeShiftNumber(
    vehicleWithAssignment.assigned_to_shift_number ??
      vehicleWithAssignment.assigned_shift_number ??
      vehicleWithAssignment.shift_number ??
      vehicleWithAssignment.assignment?.shift_number
  );
}