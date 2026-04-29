"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Camera, CarFront, FileText, Trash2 } from "lucide-react";

import Alert from "@/components/ui/alert";
import AppModal from "@/components/ui/app-modal";
import Button from "@/components/ui/button";
import FormField from "@/components/ui/form-field";
import Input from "@/components/ui/input";
import SectionCard from "@/components/ui/section-card";
import Select from "@/components/ui/select";
import { useSafeI18n } from "@/hooks/use-safe-i18n";
import { isApiClientError } from "@/lib/api-error";
import {
  createVehicle,
  uploadVehiclePhotos,
  type VehiclePhotoType,
} from "@/services/vehicles.api";
import type { CreateVehiclePayload } from "@/types/vehicle.types";

type VehicleStatusOption =
  | "available"
  | "assigned"
  | "in_service"
  | "out_of_service";

const GERMAN_LICENSE_PLATE_REGEX =
  /^[A-ZÄÖÜ]{1,3}\s[A-Z]{1,2}\s[1-9][0-9]{0,3}[EH]?$/;

function normalizeUpper(value: string) {
  return value.toUpperCase();
}

function normalizeGermanLicensePlateInput(value: string) {
  return value
    .toUpperCase()
    .replace(/-/g, " ")
    .replace(/[^A-ZÄÖÜ0-9\s]/g, "")
    .replace(/\s+/g, " ")
    .trimStart();
}

function isValidGermanLicensePlate(value: string) {
  return GERMAN_LICENSE_PLATE_REGEX.test(value.trim());
}

export default function AdminCreateVehicleScreen() {
  const router = useRouter();
  const { t } = useSafeI18n();

  const [brand, setBrand] = useState("");
  const [model, setModel] = useState("");
  const [licensePlate, setLicensePlate] = useState("");
  const [currentMileage, setCurrentMileage] = useState("");
  const [status, setStatus] = useState<VehicleStatusOption>("available");

  const [exteriorFiles, setExteriorFiles] = useState<File[]>([]);
  const [damageFiles, setDamageFiles] = useState<File[]>([]);
  const [registrationFiles, setRegistrationFiles] = useState<File[]>([]);

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const normalizedLicensePlate = licensePlate.trim();

  const canSubmit =
    !saving &&
    brand.trim() !== "" &&
    model.trim() !== "" &&
    normalizedLicensePlate !== "" &&
    isValidGermanLicensePlate(normalizedLicensePlate) &&
    currentMileage.trim() !== "";

  function getStatusLabel(value: VehicleStatusOption) {
    if (value === "available") return t("vehicles", "available");
    if (value === "assigned") return t("vehicles", "assigned");
    if (value === "in_service") return t("vehicles", "inService");

    return t("vehicles", "outOfService");
  }

  async function uploadFilesIfPresent(
    vehicleId: number,
    type: VehiclePhotoType,
    files: File[]
  ) {
    if (files.length === 0) return;

    await uploadVehiclePhotos(vehicleId, type, files);
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const parsedMileage = Number(currentMileage);

    if (!canSubmit || Number.isNaN(parsedMileage)) {
      setError(
        "Numărul de înmatriculare trebuie să fie în format german. Exemplu: B AB 1234 sau M A 123E."
      );
      return;
    }

    try {
      setSaving(true);
      setError("");

      const payload: CreateVehiclePayload = {
        brand: brand.trim().toUpperCase(),
        model: model.trim().toUpperCase(),
        license_plate: normalizedLicensePlate,
        status,
        current_mileage: parsedMileage,
      };

      const vehicle = await createVehicle(payload);

      await uploadFilesIfPresent(vehicle.id, "exterior", exteriorFiles);
      await uploadFilesIfPresent(vehicle.id, "damage", damageFiles);
      await uploadFilesIfPresent(vehicle.id, "registration", registrationFiles);

      router.push("/admin/vehicles/list");
    } catch (err) {
      setError(
        isApiClientError(err) ? err.message : t("vehicles", "failedToCreate")
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <Button
        type="button"
        variant="back"
        onClick={() => router.push("/admin/vehicles")}
      >
        <ArrowLeft className="h-4 w-4" />
        {t("common", "back")}
      </Button>

      {error ? <Alert variant="error" message={error} /> : null}

      <SectionCard
        title={t("vehicles", "createTitle")}
        icon={<CarFront className="h-5 w-5" />}
      >
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid gap-5 md:grid-cols-2">
            <FormField label={t("vehicles", "brand")} required>
              <Input
                value={brand}
                onChange={(event) =>
                  setBrand(normalizeUpper(event.target.value))
                }
              />
            </FormField>

            <FormField label={t("vehicles", "model")} required>
              <Input
                value={model}
                onChange={(event) =>
                  setModel(normalizeUpper(event.target.value))
                }
              />
            </FormField>

            <FormField label={t("vehicles", "licensePlate")} required>
              <Input
                value={licensePlate}
                placeholder="B AB 1234"
                onChange={(event) =>
                  setLicensePlate(
                    normalizeGermanLicensePlateInput(event.target.value)
                  )
                }
              />
            </FormField>

            <FormField label={t("vehicles", "currentMileage")} required>
              <Input
                type="number"
                value={currentMileage}
                onChange={(event) => setCurrentMileage(event.target.value)}
              />
            </FormField>

            <FormField label={t("common", "status")} required>
              <Select
                value={status}
                onChange={(event) =>
                  setStatus(event.target.value as VehicleStatusOption)
                }
              >
                <option value="available">{getStatusLabel("available")}</option>
                <option value="assigned">{getStatusLabel("assigned")}</option>
                <option value="in_service">
                  {getStatusLabel("in_service")}
                </option>
                <option value="out_of_service">
                  {getStatusLabel("out_of_service")}
                </option>
              </Select>
            </FormField>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <FileUploadBox
              icon={<Camera className="h-4 w-4" />}
              label={t("vehicles", "exteriorPhotos")}
              files={exteriorFiles}
              multiple
              onChange={setExteriorFiles}
            />

            <FileUploadBox
              icon={<Camera className="h-4 w-4" />}
              label={t("vehicles", "damagePhotos")}
              files={damageFiles}
              multiple
              onChange={setDamageFiles}
            />

            <FileUploadBox
              icon={<FileText className="h-4 w-4" />}
              label={t("vehicles", "registrationPhoto")}
              files={registrationFiles}
              onChange={setRegistrationFiles}
            />
          </div>

          <div className="flex justify-end gap-3">
            <Button
              type="button"
              variant="secondary"
              onClick={() => router.push("/admin/vehicles")}
            >
              {t("common", "cancel")}
            </Button>

            <Button type="submit" loading={saving} disabled={!canSubmit}>
              {t("vehicles", "createButton")}
            </Button>
          </div>
        </form>
      </SectionCard>
    </div>
  );
}

function FileUploadBox({
  icon,
  label,
  files,
  multiple = false,
  onChange,
}: {
  icon: React.ReactNode;
  label: string;
  files: File[];
  multiple?: boolean;
  onChange: (files: File[]) => void;
}) {
  const [preview, setPreview] = useState<{
    url: string;
    type: string;
    name: string;
  } | null>(null);

  function addFiles(event: React.ChangeEvent<HTMLInputElement>) {
    const newFiles = Array.from(event.target.files ?? []);

    if (multiple) {
      onChange([...files, ...newFiles]);
    } else {
      onChange(newFiles.slice(0, 1));
    }

    event.currentTarget.value = "";
  }

  function removeFile(index: number) {
    onChange(files.filter((_, fileIndex) => fileIndex !== index));
  }

  function openPreview(file: File) {
    const url = URL.createObjectURL(file);

    setPreview((current) => {
      if (current?.url) URL.revokeObjectURL(current.url);

      return {
        url,
        type: file.type,
        name: file.name,
      };
    });
  }

  function closePreview() {
    setPreview((current) => {
      if (current?.url) URL.revokeObjectURL(current.url);
      return null;
    });
  }

  useEffect(() => {
    return () => {
      if (preview?.url) URL.revokeObjectURL(preview.url);
    };
  }, [preview?.url]);

  return (
    <>
      <div className="flex h-[260px] flex-col rounded-2xl border border-white/10 bg-white/10 p-4">
        <label className="cursor-pointer">
          <div className="flex items-center gap-2 text-white">
            {icon}
            <span className="text-sm font-semibold">{label}</span>
          </div>

          <input
            type="file"
            multiple={multiple}
            className="hidden"
            onChange={addFiles}
          />
        </label>

        <div className="mt-3 flex-1 space-y-2 overflow-y-auto">
          {files.length === 0 ? (
            <p className="text-xs text-slate-400">Niciun fișier</p>
          ) : null}

          {files.map((file, index) => (
            <div
              key={`${file.name}-${index}`}
              className="flex items-center justify-between gap-2 rounded-xl border border-white/10 bg-black/20 px-3 py-2"
            >
              <button
                type="button"
                onClick={() => openPreview(file)}
                className="min-w-0 truncate text-left text-xs font-medium text-blue-300 hover:underline"
              >
                {file.name}
              </button>

              <Button
                type="button"
                size="sm"
                variant="danger"
                onClick={() => removeFile(index)}
              >
                <Trash2 className="h-3 w-3" />
              </Button>
            </div>
          ))}
        </div>
      </div>

      <AppModal open={Boolean(preview)} onClose={closePreview} title={preview?.name}>
        {preview ? (
          preview.type.includes("image") ? (
            <img
              src={preview.url}
              alt={preview.name}
              className="max-h-[70vh] w-full rounded-xl object-contain"
            />
          ) : (
            <iframe
              src={preview.url}
              title={preview.name}
              className="h-[70vh] w-full rounded-xl bg-white"
            />
          )
        ) : null}
      </AppModal>
    </>
  );
}