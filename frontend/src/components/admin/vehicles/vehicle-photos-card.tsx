"use client";

import { FileImage } from "lucide-react";

import ListChip from "@/components/patterns/list-chip";
import ListRow from "@/components/patterns/list-row";
import SectionCard from "@/components/ui/section-card";
import {
  groupVehiclePhotos,
  VEHICLE_PHOTO_GROUP_ORDER,
  type VehiclePhotoGroupKey,
} from "@/lib/vehicles/photo-groups";
import type { VehiclePhotoItem } from "@/services/vehicles.api";

type Props = {
  photos: VehiclePhotoItem[];
  labels: {
    title: string;
    empty: string;
    registration: string;
    exterior: string;
    damage: string;
    other: string;
  };
  onPreview: (photoId: number, fileName: string) => void;
};

export default function VehiclePhotosCard({ photos, labels, onPreview }: Props) {
  const groupedPhotos = groupVehiclePhotos(photos);

  function getGroupLabel(groupKey: VehiclePhotoGroupKey) {
    switch (groupKey) {
      case "registration":
        return labels.registration;
      case "exterior":
        return labels.exterior;
      case "damage":
        return labels.damage;
      case "other":
        return labels.other;
    }
  }

  return (
    <SectionCard title={labels.title} icon={<FileImage className="h-5 w-5" />}>
      {photos.length === 0 ? (
        <p className="text-sm text-slate-400">{labels.empty}</p>
      ) : (
        <div className="space-y-4">
          {VEHICLE_PHOTO_GROUP_ORDER.map((groupKey) => {
            const groupPhotos = groupedPhotos[groupKey];

            if (groupPhotos.length === 0) return null;

            return (
              <SectionCard
                key={groupKey}
                title={getGroupLabel(groupKey)}
                actions={<ListChip>{groupPhotos.length}</ListChip>}
              >
                <div className="space-y-2">
                  {groupPhotos.map((photo) => (
                    <ListRow
                      key={photo.id}
                      leading={<FileImage className="h-4 w-4" />}
                      title={photo.file_name}
                      onClick={() => onPreview(photo.id, photo.file_name)}
                    />
                  ))}
                </div>
              </SectionCard>
            );
          })}
        </div>
      )}
    </SectionCard>
  );
}