"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { FileImage } from "lucide-react";

import DataStateBoundary from "@/components/patterns/data-state-boundary";
import AppModal from "@/components/ui/app-modal";
import Button from "@/components/ui/button";
import FormField from "@/components/ui/form-field";
import Input from "@/components/ui/input";
import SectionCard from "@/components/ui/section-card";
import { ROUTES } from "@/constants/routes";
import { useSafeI18n } from "@/hooks/use-safe-i18n";
import { useMyVehicle } from "@/hooks/vehicles/use-my-vehicle";
import {
  getMyVehiclePhotoFile,
  updateMyVehicleMileage,
} from "@/services/vehicles.api";
import type { MyVehiclePhoto } from "@/types/vehicle.types";

export default function MyVehicleDetailsScreen() {
  const router = useRouter();
  const { t } = useSafeI18n();
  const { data, loading, error, refetch } = useMyVehicle();

  const isActiveAssignment = data?.assignment?.status === "active";
  const vehicle = isActiveAssignment ? data?.vehicle : null;
  const photos = useMemo(() => data?.photos ?? [], [data?.photos]);

  const [savingMileage, setSavingMileage] = useState(false);
  const [mileageError, setMileageError] = useState("");
  const [mileageSuccess, setMileageSuccess] = useState("");
  const [mileageDialogOpen, setMileageDialogOpen] = useState(false);
  const [draftMileage, setDraftMileage] = useState("");

  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewName, setPreviewName] = useState("");
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewError, setPreviewError] = useState("");

  async function openPhotoPreview(photo: MyVehiclePhoto) {
    try {
      setPreviewLoading(true);
      setPreviewError("");
      setPreviewName(photo.file_name);

      const blob = await getMyVehiclePhotoFile(photo.id);
      const objectUrl = URL.createObjectURL(blob);

      setPreviewUrl((current) => {
        if (current) URL.revokeObjectURL(current);
        return objectUrl;
      });
    } catch {
      setPreviewError("Nu s-a putut încărca poza.");
    } finally {
      setPreviewLoading(false);
    }
  }

  function closePhotoPreview() {
    setPreviewUrl((current) => {
      if (current) URL.revokeObjectURL(current);
      return null;
    });

    setPreviewName("");
    setPreviewError("");
    setPreviewLoading(false);
  }

  function openMileageDialog() {
    setDraftMileage(String(vehicle?.current_mileage ?? ""));
    setMileageError("");
    setMileageSuccess("");
    setMileageDialogOpen(true);
  }

  async function handleUpdateMileage() {
    const numericMileage = Number(draftMileage);

    if (!Number.isFinite(numericMileage) || numericMileage < 0) {
      setMileageError("Kilometrajul este invalid.");
      setMileageSuccess("");
      return;
    }

    try {
      setSavingMileage(true);
      setMileageError("");
      setMileageSuccess("");

      await updateMyVehicleMileage(numericMileage);
      await refetch();

      setMileageSuccess("Kilometraj actualizat.");
      setMileageDialogOpen(false);
    } catch {
      setMileageError("Nu s-a putut actualiza kilometrajul.");
    } finally {
      setSavingMileage(false);
    }
  }

  return (
    <>
      <DataStateBoundary
        isLoading={loading}
        isError={Boolean(error)}
        errorMessage={error ?? t("vehicles", "failedToLoad")}
      >
        <div className="space-y-4">
          <Button
            type="button"
            variant="back"
            onClick={() => router.push(ROUTES.EMPLOYEE.VEHICLE)}
          >
            {t("common", "back")}
          </Button>

          {!vehicle ? (
            <SectionCard title={t("vehicles", "noActiveAssignment")}>
              <p className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-slate-300">
                {t("vehicles", "noActiveAssignment")}
              </p>
            </SectionCard>
          ) : (
            <SectionCard title={t("nav", "myVehicle")}>
              <div className="space-y-5">
                <div className="grid gap-3 md:grid-cols-2">
                  <InfoItem
                    label={t("vehicles", "licensePlate")}
                    value={vehicle.license_plate}
                    strong
                  />

                  <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                      {t("vehicles", "currentMileage")}
                    </p>

                    <div className="mt-1 flex items-center justify-between gap-3">
                      <p className="text-lg font-bold text-white">
                        {vehicle.current_mileage ?? 0} km
                      </p>

                      <Button
                        type="button"
                        size="sm"
                        onClick={openMileageDialog}
                        disabled={savingMileage}
                        className="shrink-0 px-4"
                      >
                        Actualizează km
                      </Button>
                    </div>
                  </div>
                </div>

                {mileageSuccess ? (
                  <p className="rounded-2xl border border-emerald-400/20 bg-emerald-500/10 px-4 py-3 text-sm font-semibold text-emerald-200">
                    {mileageSuccess}
                  </p>
                ) : null}

                <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-white">
                    <FileImage className="h-4 w-4" />
                    {t("vehicles", "vehiclePhotos")}
                  </div>

                  {photos.length === 0 ? (
                    <p className="text-sm text-slate-400">
                      {t("vehicles", "noVehiclePhotos")}
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {photos.map((photo) => (
                        <button
                          key={photo.id}
                          type="button"
                          onClick={() => void openPhotoPreview(photo)}
                          className="flex w-full items-center gap-3 rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-left transition hover:bg-black/30"
                        >
                          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-black text-white">
                            <FileImage className="h-4 w-4" />
                          </span>

                          <div className="min-w-0">
                            <p className="truncate text-sm font-semibold text-white">
                              {photo.file_name}
                            </p>
                            <p className="text-xs text-slate-400">
                              {photo.mime_type} ·{" "}
                              {(photo.file_size / 1024 / 1024).toFixed(2)} MB
                            </p>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </SectionCard>
          )}
        </div>
      </DataStateBoundary>

      <AppModal
        open={mileageDialogOpen}
        onClose={() => {
          if (!savingMileage) setMileageDialogOpen(false);
        }}
        title="Actualizați km"
      >
        <div className="space-y-4">
          <FormField label="Kilometraj nou">
            <Input
              value={draftMileage}
              onChange={(event) => {
                setDraftMileage(event.target.value);
                setMileageError("");
                setMileageSuccess("");
              }}
              inputMode="numeric"
              placeholder="Introduceți kilometrajul"
              disabled={savingMileage}
            />
          </FormField>

          {mileageError ? (
            <p className="rounded-2xl border border-red-400/20 bg-red-500/10 px-4 py-3 text-sm font-semibold text-red-200">
              {mileageError}
            </p>
          ) : null}

          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setMileageDialogOpen(false)}
              disabled={savingMileage}
            >
              Anulați
            </Button>

            <Button
              type="button"
              onClick={handleUpdateMileage}
              disabled={savingMileage}
              loading={savingMileage}
            >
              Actualizați km
            </Button>
          </div>
        </div>
      </AppModal>

      <AppModal
        open={Boolean(previewUrl) || previewLoading || Boolean(previewError)}
        onClose={closePhotoPreview}
        title={previewName || t("vehicles", "vehiclePhotos")}
        loading={previewLoading}
        error={previewError}
      >
        {previewUrl ? (
          <img
            src={previewUrl}
            alt={previewName || t("vehicles", "vehiclePhotos")}
            className="max-h-[70vh] w-full rounded-2xl object-contain"
          />
        ) : null}
      </AppModal>
    </>
  );
}

function InfoItem({
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
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
        {label}
      </p>

      <p
        className={
          strong
            ? "mt-1 text-lg font-bold text-white"
            : "mt-1 text-sm font-semibold text-white"
        }
      >
        {value}
      </p>
    </div>
  );
}