"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import VehicleDetailsCard from "@/components/admin/vehicles/vehicle-details-card";
import VehiclePhotosCard from "@/components/admin/vehicles/vehicle-photos-card";
import DataStateBoundary from "@/components/patterns/data-state-boundary";
import AppModal from "@/components/ui/app-modal";
import Button from "@/components/ui/button";
import ConfirmDialog from "@/components/ui/confirm-dialog";
import { useSafeI18n } from "@/hooks/use-safe-i18n";
import { getVehicleAssignedShiftNumber } from "@/lib/vehicles/vehicle-status";
import {
  deleteVehicle,
  getAdminVehiclePhotoFile,
  getVehicle,
  getVehiclePhotos,
} from "@/services/vehicles.api";
import type { VehiclePhotoItem } from "@/services/vehicles.api";
import type { VehicleItem } from "@/types/vehicle.types";

export default function AdminVehicleDetailsScreen() {
  const router = useRouter();
  const params = useParams();
  const { t } = useSafeI18n();

  const rawId = Array.isArray(params["id-details"])
    ? params["id-details"][0]
    : params["id-details"];

  const vehicleId = Number(rawId);

  const [vehicle, setVehicle] = useState<VehicleItem | null>(null);
  const [photos, setPhotos] = useState<VehiclePhotoItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState("");

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewName, setPreviewName] = useState("");

  async function load() {
    if (!Number.isInteger(vehicleId) || vehicleId <= 0) {
      setError(t("vehicles", "invalidVehicleId"));
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError("");

      const [vehicleData, photosData] = await Promise.all([
        getVehicle(vehicleId),
        getVehiclePhotos(vehicleId),
      ]);

      setVehicle(vehicleData);
      setPhotos(photosData);
    } catch {
      setError(t("vehicles", "failedToLoadDetails"));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();

    return () => {
      setPreviewUrl((current) => {
        if (current) URL.revokeObjectURL(current);
        return null;
      });
    };
  }, [vehicleId]);

  async function handleDeleteVehicle() {
    try {
      setDeleting(true);
      setError("");

      await deleteVehicle(vehicleId);

      setConfirmOpen(false);
      router.push("/admin/vehicles/list");
      router.refresh();
    } catch {
      setError(t("vehicles", "failedToRemoveFromUse"));
      setConfirmOpen(false);
    } finally {
      setDeleting(false);
    }
  }

  async function handlePreview(photoId: number, fileName: string) {
    const blob = await getAdminVehiclePhotoFile(photoId);
    const url = URL.createObjectURL(blob);

    setPreviewUrl((current) => {
      if (current) URL.revokeObjectURL(current);
      return url;
    });

    setPreviewName(fileName);
  }

  function closePreview() {
    setPreviewUrl((current) => {
      if (current) URL.revokeObjectURL(current);
      return null;
    });

    setPreviewName("");
  }

  function getVehicleStatusLabel(currentVehicle: VehicleItem): string {
    const shiftNumber = getVehicleAssignedShiftNumber(currentVehicle);

    if (currentVehicle.status === "assigned" && shiftNumber) {
      return t("vehicles", "assignedToShift").replace(
        "{shift}",
        String(shiftNumber)
      );
    }

    switch (currentVehicle.status) {
      case "available":
        return t("vehicles", "available");
      case "assigned":
        return t("vehicles", "assigned");
      case "out_of_service":
        return t("vehicles", "outOfService");
      case "in_service":
        return t("vehicles", "inService");
      default:
        return currentVehicle.status;
    }
  }

  return (
    <>
      <div className="space-y-6">
        <Button
          variant="back"
          onClick={() => router.push("/admin/vehicles/list")}
        >
          <ArrowLeft className="h-4 w-4" />
          {t("common", "back")}
        </Button>

        <DataStateBoundary
          isLoading={loading}
          isError={Boolean(error)}
          errorMessage={error}
        >
          {vehicle ? (
            <>
              <VehicleDetailsCard
                vehicle={vehicle}
                statusLabel={getVehicleStatusLabel(vehicle)}
                isRemoving={deleting}
                onRemove={() => setConfirmOpen(true)}
                labels={{
                  title: t("vehicles", "detailsTitle"),
                  brand: t("vehicles", "brand"),
                  model: t("vehicles", "model"),
                  licensePlate: t("vehicles", "licensePlate"),
                  mileage: t("vehicles", "currentMileage"),
                  status: t("common", "status"),
                  remove: t("vehicles", "removeFromUse"),
                  removing: t("vehicles", "removingFromUse"),
                }}
              />

              <VehiclePhotosCard
                photos={photos}
                onPreview={(photoId, fileName) =>
                  void handlePreview(photoId, fileName)
                }
                labels={{
                  title: t("vehicles", "vehiclePhotos"),
                  empty: t("vehicles", "noVehiclePhotos"),
                  registration: t("vehicles", "registrationPhotos"),
                  exterior: t("vehicles", "exteriorPhotos"),
                  damage: t("vehicles", "damagePhotos"),
                  other: t("vehicles", "otherPhotos"),
                }}
              />
            </>
          ) : null}
        </DataStateBoundary>

        <AppModal open={Boolean(previewUrl)} onClose={closePreview} title={previewName}>
          {previewUrl ? (
            <img
              src={previewUrl}
              alt={previewName}
              className="max-h-[70vh] w-full rounded-xl object-contain"
            />
          ) : null}
        </AppModal>
      </div>

      <ConfirmDialog
        open={confirmOpen}
        title={t("vehicles", "removeFromUse")}
        message={t("vehicles", "removeFromUseConfirm")}
        confirmText={t("vehicles", "removeFromUse")}
        cancelText={t("common", "cancel")}
        loading={deleting}
        loadingText={t("vehicles", "removingFromUse")}
        onConfirm={() => void handleDeleteVehicle()}
        onCancel={() => {
          if (!deleting) setConfirmOpen(false);
        }}
      />
    </>
  );
}