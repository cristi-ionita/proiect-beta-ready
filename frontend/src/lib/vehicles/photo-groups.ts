import type { VehiclePhotoItem } from "@/services/vehicles.api";

export type VehiclePhotoGroupKey =
  | "registration"
  | "exterior"
  | "damage"
  | "other";

export const VEHICLE_PHOTO_GROUP_ORDER: VehiclePhotoGroupKey[] = [
  "registration",
  "exterior",
  "damage",
  "other",
];

export type VehiclePhotoGroups = Record<
  VehiclePhotoGroupKey,
  VehiclePhotoItem[]
>;

const TYPE_TO_GROUP_MAP: Record<string, VehiclePhotoGroupKey> = {
  registration: "registration",
  exterior: "exterior",
  damage: "damage",
};

export function groupVehiclePhotos(
  photos: VehiclePhotoItem[]
): VehiclePhotoGroups {
  const groups: VehiclePhotoGroups = {
    registration: [],
    exterior: [],
    damage: [],
    other: [],
  };

  for (const photo of photos) {
    const group = TYPE_TO_GROUP_MAP[photo.type] ?? "other";
    groups[group].push(photo);
  }

  return groups;
}