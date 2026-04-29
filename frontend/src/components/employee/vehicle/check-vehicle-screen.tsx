"use client";

import { useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ArrowLeft,
  CarFront,
  CheckCircle2,
  FileImage,
  Upload,
  XCircle,
} from "lucide-react";

import DataStateBoundary from "@/components/patterns/data-state-boundary";
import ListRow from "@/components/patterns/list-row";
import Alert from "@/components/ui/alert";
import AppModal from "@/components/ui/app-modal";
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
    <div className="space-y-4">
      <Button type="button" variant="back" onClick={() => router.push(backHref)}>
        <ArrowLeft className="h-4 w-4" />
        Înapoi
      </Button>

      <DataStateBoundary
        isLoading={loading}
        isError={Boolean(error)}
        errorMessage={error}
      >
        {actionDone === "confirmed" || isActive ? (
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
        ) : actionDone === "rejected" ? (
          <SectionCard
            title="Vehicul refuzat"
            icon={<XCircle className="h-5 w-5" />}
          >
            <Alert
              variant="warning"
              message="Ai refuzat vehiculul. Adminul va face o nouă alocare."
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
          <div className="space-y-4">
            <SectionCard
              title="Detalii vehicul"
              icon={<CarFront className="h-5 w-5" />}
            >
              <div className="space-y-3">
                <ListRow
                  leading={<CarFront className="h-4 w-4" />}
                  title={`${data.vehicle.brand} ${data.vehicle.model}`}
                  subtitle={data.vehicle.license_plate}
                  actions={
                    registrationPhoto ? (
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() =>
                          void handlePreview(
                            registrationPhoto.id,
                            registrationPhoto.file_name
                          )
                        }
                      >
                        Deschide talon
                      </Button>
                    ) : null
                  }
                />

                {!registrationPhoto ? (
                  <p className="text-sm text-slate-400">
                    Adminul nu a adăugat încă poza talonului.
                  </p>
                ) : null}
              </div>
            </SectionCard>

            <SectionCard
              title="Poze vehicul adăugate de admin"
              icon={<FileImage className="h-5 w-5" />}
            >
              {photoError ? <Alert variant="error" message={photoError} /> : null}

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
              <div className="space-y-4">
                {actionError ? (
                  <Alert variant="error" message={actionError} />
                ) : null}

                <div className="flex flex-col gap-3 md:flex-row md:justify-end">
                  <Button
                    type="button"
                    variant="danger"
                    disabled={Boolean(actionLoading) || Boolean(uploadingPhotoId)}
                    loading={actionLoading === "reject"}
                    onClick={() => void handleReject()}
                  >
                    <XCircle className="h-4 w-4" />
                    Nu corespunde
                  </Button>

                  <Button
                    type="button"
                    disabled={Boolean(actionLoading) || Boolean(uploadingPhotoId)}
                    loading={actionLoading === "confirm"}
                    onClick={() => void handleConfirm()}
                  >
                    <CheckCircle2 className="h-4 w-4" />
                    Confirm că datele corespund
                  </Button>
                </div>
              </div>
            </SectionCard>
          </div>
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
    <SectionCard title={title}>
      {photos.length === 0 ? (
        <p className="text-sm text-slate-400">Nu există fișiere.</p>
      ) : (
        <div className="space-y-2.5">
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
    </SectionCard>
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
    <ListRow
      leading={<FileImage className="h-4 w-4" />}
      title={photo.file_name}
      actions={
        <div className="flex flex-wrap justify-end gap-2">
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(event) =>
              void onReplace(photo.id, event.target.files?.[0] || null)
            }
          />

          <Button
            size="sm"
            variant="secondary"
            onClick={() => void onPreview(photo.id, photo.file_name)}
          >
            Vezi poza
          </Button>

          {!needsReplace ? (
            <Button
              size="sm"
              variant="danger"
              disabled={uploading}
              onClick={() => onNeedReplace(photo.id)}
            >
              Nu corespunde
            </Button>
          ) : (
            <Button
              size="sm"
              disabled={uploading}
              loading={uploading}
              onClick={onChooseFile}
            >
              <Upload className="h-4 w-4" />
              Încarcă noua poză
            </Button>
          )}
        </div>
      }
    />
  );
}