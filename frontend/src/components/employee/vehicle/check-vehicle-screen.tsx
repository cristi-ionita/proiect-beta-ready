"use client";

import { useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ArrowLeft,
  CarFront,
  CheckCircle2,
  FileImage,
  Upload,
  X,
  XCircle,
} from "lucide-react";

import DataStateBoundary from "@/components/patterns/data-state-boundary";
import Button from "@/components/ui/button";
import SectionCard from "@/components/ui/section-card";
import { ROUTES } from "@/constants/routes";

import { useMyVehicle } from "@/hooks/vehicles/use-my-vehicle";
import {
  confirmMyVehicle,
  getMyVehiclePhotoFile,
  rejectMyVehicle,
  replaceMyVehiclePhoto,
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

  const fileInputsRef = useRef<Record<number, HTMLInputElement | null>>({});

  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewName, setPreviewName] = useState("");
  const [actionLoading, setActionLoading] = useState<
    "confirm" | "reject" | null
  >(null);
  const [actionError, setActionError] = useState("");
  const [actionDone, setActionDone] = useState<
    "confirmed" | "rejected" | null
  >(null);
  const [needsReplace, setNeedsReplace] = useState<Record<number, boolean>>({});
  const [uploadingPhotoId, setUploadingPhotoId] = useState<number | null>(null);
  const [photoError, setPhotoError] = useState("");

  const assignmentStatus = data?.assignment?.status;
  const isPending = assignmentStatus === "pending";
  const isActive = assignmentStatus === "active";

  const registrationPhoto = data?.photos?.find(
    (photo) => photo.type === "registration"
  );

  const photosByType = {
    exterior: data?.photos?.filter((photo) => photo.type === "exterior") || [],
    damage: data?.photos?.filter((photo) => photo.type === "damage") || [],
  };

  async function handlePreview(photoId: number, fileName: string) {
    const blob = await getMyVehiclePhotoFile(photoId);
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

  async function handleReplacePhoto(photoId: number, file: File | null) {
    if (!file) return;

    try {
      setPhotoError("");
      setUploadingPhotoId(photoId);

      await replaceMyVehiclePhoto(photoId, file);
      await refetch();

      setNeedsReplace((current) => ({
        ...current,
        [photoId]: false,
      }));
    } catch {
      setPhotoError("Nu s-a putut actualiza poza. Încearcă din nou.");
    } finally {
      setUploadingPhotoId(null);

      const input = fileInputsRef.current[photoId];
      if (input) input.value = "";
    }
  }

  async function handleConfirm() {
    try {
      setActionLoading("confirm");
      setActionError("");

      await confirmMyVehicle();
      setActionDone("confirmed");
      await refetch();
    } catch {
      setActionError("Nu s-a putut confirma vehiculul.");
    } finally {
      setActionLoading(null);
    }
  }

  async function handleReject() {
    try {
      setActionLoading("reject");
      setActionError("");

      await rejectMyVehicle();
      setActionDone("rejected");
      await refetch();
    } catch {
      setActionError("Nu s-a putut refuza vehiculul.");
    } finally {
      setActionLoading(null);
    }
  }

  return (
    <DataStateBoundary
      isLoading={loading}
      isError={Boolean(error)}
      errorMessage={error}
    >
      <div className="space-y-4">
        <Button
          type="button"
          variant="ghost"
          onClick={() => router.push(backHref)}
          className="rounded-full border border-white/10 bg-white/10 px-4 py-2 text-white hover:bg-white/15"
        >
          <ArrowLeft className="h-4 w-4" />
          Înapoi
        </Button>

        {actionDone === "confirmed" || isActive ? (
          <SectionCard
            title="Vehicul preluat"
            icon={<CheckCircle2 className="h-5 w-5" />}
          >
            <p className="rounded-2xl border border-emerald-300/30 bg-emerald-500/10 p-4 text-sm font-semibold text-emerald-200">
              Vehiculul {data?.vehicle?.license_plate ?? ""} a fost preluat cu
              succes. Alocarea este activă.
            </p>
          </SectionCard>
        ) : actionDone === "rejected" ? (
          <SectionCard
            title="Vehicul refuzat"
            icon={<XCircle className="h-5 w-5" />}
          >
            <p className="rounded-2xl border border-rose-300/30 bg-rose-500/10 p-4 text-sm font-semibold text-rose-200">
              Ai refuzat vehiculul. Adminul va face o nouă alocare.
            </p>
          </SectionCard>
        ) : !data?.vehicle || !data.assignment ? (
          <SectionCard
            title="Verificare vehicul"
            icon={<CarFront className="h-5 w-5" />}
          >
            <p className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-slate-300">
              Nu ai nicio mașină alocată momentan.
            </p>
          </SectionCard>
        ) : isPending ? (
          <>
            <SectionCard
              title="Detalii vehicul"
              icon={<CarFront className="h-5 w-5" />}
            >
              <div className="space-y-4">
                <div className="grid gap-3 md:grid-cols-3">
                  <CompactVehicleItem
                    label="Marcă"
                    value={data.vehicle.brand}
                  />
                  <CompactVehicleItem
                    label="Model"
                    value={data.vehicle.model}
                  />
                  <CompactVehicleItem
                    label="Număr înmatriculare"
                    value={data.vehicle.license_plate}
                    strong
                  />
                </div>

                <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-400">
                    Talon vehicul
                  </p>

                  {registrationPhoto ? (
                    <button
                      type="button"
                      onClick={() =>
                        void handlePreview(
                          registrationPhoto.id,
                          registrationPhoto.file_name
                        )
                      }
                      className="block w-full rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-left text-sm font-semibold text-white transition hover:bg-white/10"
                    >
                      Deschide talon
                    </button>
                  ) : (
                    <p className="rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-sm text-slate-400">
                      Adminul nu a adăugat încă poza talonului.
                    </p>
                  )}
                </div>
              </div>
            </SectionCard>

            <SectionCard
              title="Poze vehicul adăugate de admin"
              icon={<FileImage className="h-5 w-5" />}
            >
              {photoError ? (
                <div className="mb-4 rounded-2xl border border-rose-300/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
                  {photoError}
                </div>
              ) : null}

              <div className="space-y-4">
                <PhotoGroup
                  title="Poze exterior"
                  photos={photosByType.exterior}
                  needsReplace={needsReplace}
                  uploadingPhotoId={uploadingPhotoId}
                  fileInputsRef={fileInputsRef}
                  onPreview={handlePreview}
                  onNeedReplace={(photoId) =>
                    setNeedsReplace((current) => ({
                      ...current,
                      [photoId]: true,
                    }))
                  }
                  onReplace={handleReplacePhoto}
                />

                <PhotoGroup
                  title="Poze daune"
                  photos={photosByType.damage}
                  needsReplace={needsReplace}
                  uploadingPhotoId={uploadingPhotoId}
                  fileInputsRef={fileInputsRef}
                  onPreview={handlePreview}
                  onNeedReplace={(photoId) =>
                    setNeedsReplace((current) => ({
                      ...current,
                      [photoId]: true,
                    }))
                  }
                  onReplace={handleReplacePhoto}
                />
              </div>
            </SectionCard>

            <SectionCard
              title="Confirmare alocare"
              icon={<CheckCircle2 className="h-5 w-5" />}
            >
              {actionError ? (
                <div className="mb-4 rounded-2xl border border-rose-300/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
                  {actionError}
                </div>
              ) : null}

              <div className="flex flex-col gap-3 md:flex-row md:justify-end">
                <Button
                  type="button"
                  disabled={Boolean(actionLoading) || Boolean(uploadingPhotoId)}
                  loading={actionLoading === "reject"}
                  onClick={() => void handleReject()}
                  className="rounded-full bg-red-600 text-white hover:bg-red-700"
                >
                  <XCircle className="h-4 w-4" />
                  Nu corespunde
                </Button>

                <Button
                  type="button"
                  disabled={Boolean(actionLoading) || Boolean(uploadingPhotoId)}
                  loading={actionLoading === "confirm"}
                  onClick={() => void handleConfirm()}
                  className="rounded-full bg-emerald-600 text-white hover:bg-emerald-700"
                >
                  <CheckCircle2 className="h-4 w-4" />
                  Confirm că datele corespund
                </Button>
              </div>
            </SectionCard>
          </>
        ) : (
          <SectionCard
            title="Status alocare"
            icon={<CarFront className="h-5 w-5" />}
          >
            <p className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-slate-300">
              Nu există o alocare în așteptare pentru verificare.
            </p>
          </SectionCard>
        )}

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

function CompactVehicleItem({
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
      <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-400">
        {label}
      </p>
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

function PhotoGroup({
  title,
  photos,
  needsReplace,
  uploadingPhotoId,
  fileInputsRef,
  onPreview,
  onNeedReplace,
  onReplace,
}: {
  title: string;
  photos: VehiclePhoto[];
  needsReplace: Record<number, boolean>;
  uploadingPhotoId: number | null;
  fileInputsRef: React.MutableRefObject<Record<number, HTMLInputElement | null>>;
  onPreview: (id: number, name: string) => Promise<void>;
  onNeedReplace: (id: number) => void;
  onReplace: (id: number, file: File | null) => Promise<void>;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
      <p className="mb-3 text-sm font-semibold text-white">{title}</p>

      {photos.length === 0 ? (
        <p className="text-sm text-slate-400">Nu există fișiere.</p>
      ) : (
        <div className="space-y-2">
          {photos.map((photo) => (
            <PhotoReviewRow
              key={photo.id}
              photo={photo}
              needsReplace={Boolean(needsReplace[photo.id])}
              uploading={uploadingPhotoId === photo.id}
              inputRef={(element) => {
                fileInputsRef.current[photo.id] = element;
              }}
              onPreview={onPreview}
              onNeedReplace={onNeedReplace}
              onChooseFile={() => fileInputsRef.current[photo.id]?.click()}
              onReplace={onReplace}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function PhotoReviewRow({
  photo,
  needsReplace,
  uploading,
  inputRef,
  onPreview,
  onNeedReplace,
  onChooseFile,
  onReplace,
}: {
  photo: VehiclePhoto;
  needsReplace: boolean;
  uploading: boolean;
  inputRef: (element: HTMLInputElement | null) => void;
  onPreview: (id: number, name: string) => Promise<void>;
  onNeedReplace: (id: number) => void;
  onChooseFile: () => void;
  onReplace: (id: number, file: File | null) => Promise<void>;
}) {
  return (
    <div className="rounded-xl border border-white/10 bg-black/20 px-3 py-2">
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(event) =>
          void onReplace(photo.id, event.target.files?.[0] || null)
        }
      />

      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <button
          type="button"
          onClick={() => void onPreview(photo.id, photo.file_name)}
          className="min-w-0 truncate text-left text-sm font-semibold text-white transition hover:text-emerald-200"
        >
          {photo.file_name}
        </button>

        <div className="flex flex-wrap gap-2">
          {!needsReplace ? (
            <button
              type="button"
              disabled={uploading}
              onClick={() => onNeedReplace(photo.id)}
              className="rounded-full border border-rose-300/30 bg-rose-500/10 px-2.5 py-1 text-[11px] font-semibold text-rose-200 transition hover:bg-rose-500/20 disabled:opacity-60"
            >
              Nu corespunde
            </button>
          ) : (
            <button
              type="button"
              disabled={uploading}
              onClick={onChooseFile}
              className="inline-flex items-center gap-1 rounded-full border border-emerald-300/30 bg-emerald-500/10 px-2.5 py-1 text-[11px] font-semibold text-emerald-200 transition hover:bg-emerald-500/20 disabled:opacity-60"
            >
              <Upload className="h-3 w-3" />
              {uploading ? "Se încarcă..." : "Încarcă noua poză"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}