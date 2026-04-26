"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Camera, CarFront, FileText, Trash2, X } from "lucide-react";

import Alert from "@/components/ui/alert";
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

export default function AdminCreateVehicleScreen() {
  const router = useRouter();
  const { t } = useSafeI18n();

  const [brand, setBrand] = useState("");
  const [model, setModel] = useState("");
  const [licensePlate, setLicensePlate] = useState("");
  const [year, setYear] = useState("");
  const [vin, setVin] = useState("");
  const [currentMileage, setCurrentMileage] = useState("");
  const [status, setStatus] = useState<VehicleStatusOption>("available");

  const [exteriorFiles, setExteriorFiles] = useState<File[]>([]);
  const [damageFiles, setDamageFiles] = useState<File[]>([]);
  const [registrationFiles, setRegistrationFiles] = useState<File[]>([]);

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const canSubmit =
    !saving &&
    brand.trim() !== "" &&
    model.trim() !== "" &&
    licensePlate.trim() !== "" &&
    year.trim() !== "" &&
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

    const parsedYear = Number(year);
    const parsedMileage = Number(currentMileage);

    if (!canSubmit || !parsedYear || Number.isNaN(parsedMileage)) return;

    try {
      setSaving(true);
      setError("");

      const payload: CreateVehiclePayload = {
        brand: brand.trim(),
        model: model.trim(),
        license_plate: licensePlate.trim(),
        year: parsedYear,
        vin: vin.trim() || undefined,
        status,
        current_mileage: parsedMileage,
      };

      const vehicle = await createVehicle(payload);

      await uploadFilesIfPresent(vehicle.id, "exterior", exteriorFiles);
      await uploadFilesIfPresent(vehicle.id, "damage", damageFiles);
      await uploadFilesIfPresent(
        vehicle.id,
        "registration",
        registrationFiles
      );

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
        variant="ghost"
        onClick={() => router.push("/admin/vehicles")}
        className="w-fit rounded-full border border-white/10 bg-white/10 px-4 py-2 text-white hover:bg-white/15"
      >
        <ArrowLeft className="h-4 w-4" />
        {t("common", "back")}
      </Button>

      {error && <Alert variant="error" message={error} />}

      <SectionCard
        title={t("vehicles", "createTitle")}
        icon={<CarFront className="h-5 w-5" />}
      >
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid gap-5 md:grid-cols-2">
            <FormField label={t("vehicles", "brand")} required>
              <Input value={brand} onChange={(e) => setBrand(e.target.value)} />
            </FormField>

            <FormField label={t("vehicles", "model")} required>
              <Input value={model} onChange={(e) => setModel(e.target.value)} />
            </FormField>

            <FormField label={t("vehicles", "licensePlate")} required>
              <Input
                value={licensePlate}
                onChange={(e) => setLicensePlate(e.target.value)}
              />
            </FormField>

            <FormField label={t("vehicles", "year")} required>
              <Input
                type="number"
                value={year}
                onChange={(e) => setYear(e.target.value)}
              />
            </FormField>

            <FormField label={t("vehicles", "vin")}>
              <Input value={vin} onChange={(e) => setVin(e.target.value)} />
            </FormField>

            <FormField label={t("vehicles", "currentMileage")} required>
              <Input
                type="number"
                value={currentMileage}
                onChange={(e) => setCurrentMileage(e.target.value)}
              />
            </FormField>

            <FormField label={t("common", "status")} required>
              <Select
                value={status}
                onChange={(e) =>
                  setStatus(e.target.value as VehicleStatusOption)
                }
              >
                <option value="available">
                  {getStatusLabel("available")}
                </option>
                <option value="assigned">
                  {getStatusLabel("assigned")}
                </option>
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
  } | null>(null);

  function addFiles(e: React.ChangeEvent<HTMLInputElement>) {
    const newFiles = Array.from(e.target.files ?? []);
    if (multiple) onChange([...files, ...newFiles]);
    else onChange(newFiles.slice(0, 1));
    e.currentTarget.value = "";
  }

  function removeFile(index: number) {
    onChange(files.filter((_, i) => i !== index));
  }

  function openPreview(file: File) {
    const url = URL.createObjectURL(file);
    setPreview({ url, type: file.type });
  }

  function closePreview() {
    if (preview) URL.revokeObjectURL(preview.url);
    setPreview(null);
  }

  // ESC pentru închidere
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") closePreview();
    }
    if (preview) window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [preview]);

  return (
    <>
      <div className="flex h-[260px] flex-col rounded-2xl border border-white/10 bg-white/5 p-4">
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

        <div className="mt-3 flex-1 overflow-y-auto space-y-2">
          {files.length === 0 && (
            <p className="text-xs text-slate-400">Niciun fișier</p>
          )}

          {files.map((file, index) => (
            <div
              key={index}
              className="flex items-center justify-between rounded bg-black/30 px-2 py-1"
            >
              <button
                onClick={() => openPreview(file)}
                className="truncate text-xs text-blue-300 hover:underline"
              >
                {file.name}
              </button>

              <button onClick={() => removeFile(index)}>
                <Trash2 className="h-3 w-3 text-red-400" />
              </button>
            </div>
          ))}
        </div>
      </div>

      {preview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
          {/* buton închidere */}
          <button
            onClick={closePreview}
            className="absolute right-4 top-4 rounded-full bg-black/60 p-2 text-white hover:bg-black/80"
          >
            <X className="h-5 w-5" />
          </button>

          {/* click pe fundal închide */}
          <div
            className="absolute inset-0"
            onClick={closePreview}
          />

          {/* conținut */}
          <div className="relative z-10 max-h-full max-w-full">
            {preview.type.includes("image") ? (
              <img
                src={preview.url}
                className="max-h-[90vh] max-w-[90vw] rounded-xl"
              />
            ) : (
              <iframe
                src={preview.url}
                className="h-[90vh] w-[90vw] rounded-xl bg-white"
              />
            )}
          </div>
        </div>
      )}
    </>
  );
}