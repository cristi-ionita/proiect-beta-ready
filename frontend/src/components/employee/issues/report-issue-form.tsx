"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { CarFront, Plus, Settings, Trash2 } from "lucide-react";

import DataStateBoundary from "@/components/patterns/data-state-boundary";
import AppModal from "@/components/ui/app-modal";
import Button from "@/components/ui/button";
import FormField from "@/components/ui/form-field";
import Input from "@/components/ui/input";
import SectionCard from "@/components/ui/section-card";
import Textarea from "@/components/ui/textarea";
import { ROUTES } from "@/constants/routes";
import { useReportIssue } from "@/hooks/issues/use-report-issue";
import { useSafeI18n } from "@/hooks/use-safe-i18n";
import { useMyVehicle } from "@/hooks/vehicles/use-my-vehicle";
import { cn } from "@/lib/utils";

type PreviewFile = {
  file: File;
  url: string;
};

export default function ReportIssueForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { t } = useSafeI18n();

  const from = searchParams.get("from");
  const backHref =
    from === "dashboard" ? "/employee/dashboard" : ROUTES.EMPLOYEE.ISSUES;

  const { loading, error, success, submit } = useReportIssue();
  const { data: vehicleData, loading: vehicleLoading } = useMyVehicle();

  const [needServiceInKm, setNeedServiceInKm] = useState("");
  const [needBrakes, setNeedBrakes] = useState(false);
  const [needTires, setNeedTires] = useState(false);
  const [needOil, setNeedOil] = useState(false);
  const [problemDescription, setProblemDescription] = useState("");
  const [files, setFiles] = useState<PreviewFile[]>([]);
  const [selectedPreview, setSelectedPreview] = useState<PreviewFile | null>(
    null
  );

  useEffect(() => {
    return () => {
      files.forEach((item) => URL.revokeObjectURL(item.url));
    };
  }, [files]);

  function handleFilesChange(event: React.ChangeEvent<HTMLInputElement>) {
    const selectedFiles = Array.from(event.target.files ?? [])
      .filter((file) => file.type.startsWith("image/"))
      .map((file) => ({
        file,
        url: URL.createObjectURL(file),
      }));

    setFiles((currentFiles) => [...currentFiles, ...selectedFiles]);
    event.target.value = "";
  }

  function removeFile(index: number) {
    setFiles((currentFiles) => {
      const fileToRemove = currentFiles[index];

      if (fileToRemove) {
        URL.revokeObjectURL(fileToRemove.url);
      }

      return currentFiles.filter((_, itemIndex) => itemIndex !== index);
    });
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const result = await submit({
      need_service_in_km: needServiceInKm ? Number(needServiceInKm) : undefined,
      need_brakes: needBrakes,
      need_tires: needTires,
      need_oil: needOil,
      other_problems: problemDescription || undefined,
      files: files.map((item) => item.file),
    });

    if (result) {
      router.push(backHref);
    }
  }

  return (
    <>
      <DataStateBoundary
        isLoading={vehicleLoading}
        loadingText={t("issues", "loadingVehicleData")}
      >
        <div className="space-y-4">
          <Button
            type="button"
            variant="back"
            onClick={() => router.push(backHref)}
          >
            {t("common", "back")}
          </Button>

          {!vehicleData?.assignment ? (
            <SectionCard title={t("issues", "reportIssue")}>
              <p className="text-sm text-slate-300">
                {t("issues", "noAssignedVehicleReport")}
              </p>
            </SectionCard>
          ) : (
            <SectionCard title={t("issues", "reportIssue")}>
              <form onSubmit={handleSubmit} className="space-y-6">
                {error ? (
                  <DataStateBoundary isError errorMessage={error}>
                    <div />
                  </DataStateBoundary>
                ) : null}

                {success ? (
                  <p className="text-sm font-semibold text-emerald-400">
                    {success}
                  </p>
                ) : null}

                <div className="space-y-4 rounded-2xl border border-white/10 bg-black/10 p-4">
                  <div className="flex items-center gap-2 border-b border-white/10 pb-3">
                    <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-white">
                      <Settings className="h-4 w-4" />
                    </span>

                    <h3 className="text-sm font-bold uppercase tracking-wide text-white">
                      {t("issues", "basicServiceChecks")}
                    </h3>
                  </div>

                  <FormField label={t("issues", "serviceInKm")}>
                    <Input
                      value={needServiceInKm}
                      onChange={(event) =>
                        setNeedServiceInKm(event.target.value)
                      }
                      placeholder={t("vehicles", "optional")}
                      inputMode="numeric"
                    />
                  </FormField>

                  <div className="grid gap-3 sm:grid-cols-3">
                    <IssueSelectButton
                      label={t("issues", "brakes")}
                      checked={needBrakes}
                      onClick={() => setNeedBrakes((value) => !value)}
                    />

                    <IssueSelectButton
                      label={t("issues", "tires")}
                      checked={needTires}
                      onClick={() => setNeedTires((value) => !value)}
                    />

                    <IssueSelectButton
                      label={t("issues", "oil")}
                      checked={needOil}
                      onClick={() => setNeedOil((value) => !value)}
                    />
                  </div>

                  <FormField label={t("issues", "otherProblems")}>
                    <Textarea
                      value={problemDescription}
                      onChange={(event) =>
                        setProblemDescription(event.target.value)
                      }
                      placeholder={t("issues", "otherProblemsPlaceholder")}
                    />
                  </FormField>

                  <PhotoUpload
                    files={files}
                    onChange={handleFilesChange}
                    onRemove={removeFile}
                    onPreview={setSelectedPreview}
                  />
                </div>

                <div className="flex justify-end border-t border-white/10 pt-4">
                  <Button type="submit" disabled={loading} loading={loading}>
                    {t("issues", "sendIssue")}
                  </Button>
                </div>
              </form>
            </SectionCard>
          )}
        </div>
      </DataStateBoundary>

      <AppModal
        open={Boolean(selectedPreview)}
        onClose={() => setSelectedPreview(null)}
        title={selectedPreview?.file.name || t("issues", "issuePhoto")}
      >
        {selectedPreview ? (
          <img
            src={selectedPreview.url}
            alt={selectedPreview.file.name}
            className="max-h-[70vh] w-full rounded-2xl object-contain"
          />
        ) : null}
      </AppModal>
    </>
  );
}

function PhotoUpload({
  files,
  onChange,
  onRemove,
  onPreview,
}: {
  files: PreviewFile[];
  onChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onRemove: (index: number) => void;
  onPreview: (file: PreviewFile) => void;
}) {
  return (
    <div className="space-y-3 rounded-2xl border border-white/10 bg-white/5 p-4">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-semibold text-white">Adaugă foto</p>

        <label className="cursor-pointer">
          <input
            type="file"
            accept="image/*"
            multiple
            onChange={onChange}
            className="hidden"
          />

          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-600 text-white transition hover:bg-blue-500">
            <Plus className="h-5 w-5" />
          </span>
        </label>
      </div>

      {files.length > 0 ? (
        <div className="space-y-2">
          {files.map((item, index) => (
            <div
              key={`${item.file.name}-${index}`}
              className="flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-black/20 px-3 py-2"
            >
              <button
                type="button"
                onClick={() => onPreview(item)}
                className="min-w-0 flex-1 text-left"
              >
                <p className="truncate text-sm font-semibold text-white">
                  {item.file.name}
                </p>
              </button>

              <button
                type="button"
                onClick={() => onRemove(index)}
                className="rounded-full bg-red-500/10 p-2 text-red-300 transition hover:bg-red-500/20"
                aria-label="Șterge poza"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-xs text-slate-400">Nu ai adăugat nicio poză.</p>
      )}
    </div>
  );
}

function IssueSelectButton({
  label,
  checked,
  onClick,
}: {
  label: string;
  checked: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded-2xl border px-4 py-3 text-sm font-semibold transition",
        checked
          ? "border-emerald-300/40 bg-emerald-400/20 text-emerald-100"
          : "border-white/10 bg-white/10 text-slate-300 hover:bg-white/15"
      )}
    >
      {label}
    </button>
  );
}