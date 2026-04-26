"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, CarFront, FileImage, X } from "lucide-react";

import DataStateBoundary from "@/components/patterns/data-state-boundary";
import Button from "@/components/ui/button";
import SectionCard from "@/components/ui/section-card";

import {
  getAdminVehiclePhotoFile,
  getVehicle,
  getVehiclePhotos,
} from "@/services/vehicles.api";

import type { VehicleItem } from "@/types/vehicle.types";
import type { VehiclePhotoItem } from "@/services/vehicles.api";

export default function AdminVehicleDetailsScreen() {
  const router = useRouter();
  const params = useParams();

  const rawId = Array.isArray(params["id-details"])
    ? params["id-details"][0]
    : params["id-details"];

  const vehicleId = Number(rawId);

  const [vehicle, setVehicle] = useState<VehicleItem | null>(null);
  const [photos, setPhotos] = useState<VehiclePhotoItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewName, setPreviewName] = useState("");

  async function load() {
    if (!Number.isInteger(vehicleId) || vehicleId <= 0) {
      setError("ID vehicul invalid.");
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError("");

      const vehicleData = await getVehicle(vehicleId);
      setVehicle(vehicleData);

      const photosData = await getVehiclePhotos(vehicleId);
      setPhotos(photosData);
    } catch {
      setError("Nu s-au putut încărca detaliile vehiculului.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, [vehicleId]);

  async function handlePreview(photoId: number, fileName: string) {
    const blob = await getAdminVehiclePhotoFile(photoId);
    const url = URL.createObjectURL(blob);

    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }

    setPreviewUrl(url);
    setPreviewName(fileName);
  }

  function closePreview() {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }

    setPreviewUrl(null);
    setPreviewName("");
  }

  return (
    <DataStateBoundary
      isLoading={loading}
      isError={Boolean(error)}
      errorMessage={error}
    >
      <div className="space-y-6">
        <Button
          variant="ghost"
          onClick={() => router.push("/admin/vehicles/list")}
          className="rounded-full border border-white/10 bg-white/10 px-4 py-2 text-white hover:bg-white/15"
        >
          <ArrowLeft className="h-4 w-4" />
          Înapoi
        </Button>

        {vehicle ? (
          <>
            <SectionCard
              title="Detalii vehicul"
              icon={<CarFront className="h-5 w-5" />}
            >
              <div className="grid gap-3 md:grid-cols-3">
                <CompactItem label="Marcă" value={vehicle.brand} />
                <CompactItem label="Model" value={vehicle.model} />
                <CompactItem
                  label="Număr"
                  value={vehicle.license_plate}
                  strong
                />
              </div>

              <div className="mt-4 grid gap-3 md:grid-cols-2">
                <CompactItem label="An" value={String(vehicle.year)} />
                <CompactItem label="VIN" value={vehicle.vin ?? "—"} />
                <CompactItem
                  label="Kilometraj"
                  value={`${vehicle.current_mileage} km`}
                />
                <CompactItem label="Status" value={vehicle.status} />
              </div>
            </SectionCard>

            <SectionCard
              title="Poze vehicul"
              icon={<FileImage className="h-5 w-5" />}
            >
              {photos.length === 0 ? (
                <p className="text-sm text-slate-400">
                  Nu există poze pentru acest vehicul.
                </p>
              ) : (
                <div className="space-y-2">
                  {photos.map((photo) => (
                    <button
                      key={photo.id}
                      type="button"
                      onClick={() =>
                        void handlePreview(photo.id, photo.file_name)
                      }
                      className="block w-full rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-left text-sm text-white hover:bg-white/10"
                    >
                      {photo.file_name}
                    </button>
                  ))}
                </div>
              )}
            </SectionCard>
          </>
        ) : null}

        {previewUrl ? (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 px-4">
            <div className="w-full max-w-4xl rounded-2xl border border-white/10 bg-slate-900 p-4">
              <div className="mb-3 flex items-center justify-between">
                <p className="truncate text-sm font-semibold text-white">
                  {previewName}
                </p>

                <button
                  type="button"
                  onClick={closePreview}
                  className="rounded-full bg-white/10 p-2 text-white hover:bg-white/15"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <img
                src={previewUrl}
                alt={previewName}
                className="max-h-[75vh] w-full object-contain"
              />
            </div>
          </div>
        ) : null}
      </div>
    </DataStateBoundary>
  );
}

function CompactItem({
  label,
  value,
  strong = false,
}: {
  label: string;
  value: string;
  strong?: boolean;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
      <p className="mb-1 text-xs text-slate-400">{label}</p>
      <p
        className={
          strong
            ? "text-base font-bold text-white"
            : "text-sm font-semibold text-white"
        }
      >
        {value}
      </p>
    </div>
  );
}