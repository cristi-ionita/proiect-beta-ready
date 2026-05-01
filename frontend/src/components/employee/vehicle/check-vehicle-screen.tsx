"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { CarFront, CheckCircle2, FileImage, XCircle } from "lucide-react";

import DataStateBoundary from "@/components/patterns/data-state-boundary";
import Alert from "@/components/ui/alert";
import AppModal from "@/components/ui/app-modal";
import Button from "@/components/ui/button";
import SectionCard from "@/components/ui/section-card";
import { ROUTES } from "@/constants/routes";
import { useMyVehicle } from "@/hooks/vehicles/use-my-vehicle";
import {
  confirmMyVehicle,
  getMyVehiclePhotoFile,
} from "@/services/vehicles.api";

type VehiclePhoto = {
  id: number;
  type: string;
  file_name: string;
};

export default function CheckVehicleScreen() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const from = searchParams.get("from");

  const backHref =
    from === "dashboard" ? "/employee/dashboard" : ROUTES.EMPLOYEE.VEHICLE;

  const { data, loading, error, refetch } = useMyVehicle();

  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewName, setPreviewName] = useState("");
  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState("");
  const [actionDone, setActionDone] = useState(false);

  const assignmentStatus = data?.assignment?.status;
  const isPending = assignmentStatus === "pending";
  const isActive = assignmentStatus === "active";

  const registrationPhoto = data?.photos?.find(
    (photo) => photo.type === "registration"
  );

  const exteriorPhotos =
    data?.photos?.filter((photo) => photo.type === "exterior") || [];

  const damagePhotos =
    data?.photos?.filter((photo) => photo.type === "damage") || [];

  async function handlePreview(photoId: number, fileName: string) {
    const blob = await getMyVehiclePhotoFile(photoId);
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

  async function handleConfirm() {
    try {
      setActionLoading(true);
      setActionError("");

      await confirmMyVehicle();
      setActionDone(true);
      await refetch();
    } catch {
      setActionError("Nu s-a putut confirma vehiculul.");
    } finally {
      setActionLoading(false);
    }
  }

  return (
    <div className="space-y-4">
      <Button type="button" variant="back" onClick={() => router.push(backHref)}>
        Înapoi
      </Button>

      <DataStateBoundary
        isLoading={loading}
        isError={Boolean(error)}
        errorMessage={error}
      >
        {actionDone || isActive ? (
          <SectionCard
            title="Vehicul preluat"
            icon={<CheckCircle2 className="h-5 w-5" />}
          >
            <Alert
              variant="success"
              message={`Vehiculul ${
                data?.vehicle?.license_plate ?? ""
              } a fost preluat cu succes. Alocarea este activă.`}
            />
          </SectionCard>
        ) : !data?.vehicle || !data.assignment ? (
          <SectionCard
            title="Verificare vehicul"
            icon={<CarFront className="h-5 w-5" />}
          >
            <p className="text-sm text-slate-300">
              Nu ai nicio mașină alocată momentan.
            </p>
          </SectionCard>
        ) : isPending ? (
          <SectionCard
            title="Detalii vehicul"
            icon={<CarFront className="h-5 w-5" />}
          >
            <div className="space-y-5">
              {actionError ? <Alert variant="error" message={actionError} /> : null}

              <div className="rounded-3xl border border-white/10 bg-white/10 p-4">
                <div className="flex min-w-0 items-center gap-3">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-black/60 text-white">
                    <CarFront className="h-5 w-5" />
                  </div>

                  <div className="min-w-0">
                    <h2 className="truncate text-lg font-bold text-white">
                      {data.vehicle.brand} {data.vehicle.model}
                    </h2>
                    <p className="text-sm font-medium text-slate-400">
                      {data.vehicle.license_plate}
                    </p>
                  </div>
                </div>
              </div>

              <div className="rounded-3xl border border-white/10 bg-white/5 p-4">
                <div className="mb-4 flex items-center gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-black/60 text-white">
                    <FileImage className="h-4 w-4" />
                  </div>
                  <h3 className="text-base font-bold text-white">
                    Poze vehicul adăugate de admin
                  </h3>
                </div>

                <div className="space-y-4">
                  <PhotoGroup
                    title="Talon"
                    photos={registrationPhoto ? [registrationPhoto] : []}
                    onPreview={handlePreview}
                  />

                  <PhotoGroup
                    title="Poze exterior"
                    photos={exteriorPhotos}
                    onPreview={handlePreview}
                  />

                  <PhotoGroup
                    title="Poze daune"
                    photos={damagePhotos}
                    onPreview={handlePreview}
                  />
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <Button
                  type="button"
                  disabled={actionLoading}
                  loading={actionLoading}
                  onClick={() => void handleConfirm()}
                  className="w-full sm:w-auto"
                >
                  <CheckCircle2 className="h-4 w-4" />
                  Confirmă vehicul
                </Button>
              </div>
            </div>
          </SectionCard>
        ) : (
          <SectionCard
            title="Status alocare"
            icon={<CarFront className="h-5 w-5" />}
          >
            <p className="text-sm text-slate-300">
              Nu există o alocare în așteptare pentru verificare.
            </p>
          </SectionCard>
        )}
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
  );
}

function PhotoGroup({
  title,
  photos,
  onPreview,
}: {
  title: string;
  photos: VehiclePhoto[];
  onPreview: (id: number, name: string) => Promise<void>;
}) {
  return (
    <div className="rounded-3xl border border-white/10 bg-white/5 p-4">
      <h4 className="mb-3 text-sm font-bold text-white">{title}</h4>

      {photos.length === 0 ? (
        <p className="text-sm text-slate-400">Nu există fișiere.</p>
      ) : (
        <div className="space-y-2.5">
          {photos.map((photo) => (
            <button
              key={photo.id}
              type="button"
              onClick={() => void onPreview(photo.id, photo.file_name)}
              className="flex w-full min-w-0 items-center gap-3 rounded-2xl border border-white/10 bg-white/10 p-3 text-left transition hover:bg-white/15"
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-black/50 text-white">
                <FileImage className="h-4 w-4" />
              </div>

              <span className="min-w-0 truncate text-sm font-semibold text-white">
                {photo.file_name}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}