"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ArrowLeft,
  CarFront,
  Gauge,
  ImagePlus,
  Settings,
  Trash2,
  TriangleAlert,
} from "lucide-react";

import DataStateBoundary from "@/components/patterns/data-state-boundary";
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

type FileGroup = "service" | "dashboard" | "other";

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
  const [dashboardChecks, setDashboardChecks] = useState("");
  const [otherProblems, setOtherProblems] = useState("");

  const [serviceFiles, setServiceFiles] = useState<File[]>([]);
  const [dashboardFiles, setDashboardFiles] = useState<File[]>([]);
  const [otherFiles, setOtherFiles] = useState<File[]>([]);

  function getFiles(group: FileGroup) {
    if (group === "service") return serviceFiles;
    if (group === "dashboard") return dashboardFiles;
    return otherFiles;
  }

  function setFilesForGroup(group: FileGroup, files: File[]) {
    if (group === "service") setServiceFiles(files);
    if (group === "dashboard") setDashboardFiles(files);
    if (group === "other") setOtherFiles(files);
  }

  function handleFilesChange(
    group: FileGroup,
    event: React.ChangeEvent<HTMLInputElement>
  ) {
    const selectedFiles = Array.from(event.target.files ?? []).filter((file) =>
      file.type.startsWith("image/")
    );

    setFilesForGroup(group, [...getFiles(group), ...selectedFiles]);
    event.target.value = "";
  }

  function removeFile(group: FileGroup, index: number) {
    setFilesForGroup(
      group,
      getFiles(group).filter((_, itemIndex) => itemIndex !== index)
    );
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const result = await submit({
      need_service_in_km: needServiceInKm ? Number(needServiceInKm) : undefined,
      need_brakes: needBrakes,
      need_tires: needTires,
      need_oil: needOil,
      dashboard_checks: dashboardChecks || undefined,
      other_problems: otherProblems || undefined,
      files: [...serviceFiles, ...dashboardFiles, ...otherFiles],
    });

    if (result) {
      router.push(backHref);
    }
  }

  return (
    <DataStateBoundary
      isLoading={vehicleLoading}
      loadingText={t("issues", "loadingVehicleData")}
    >
      <div className="space-y-4">
        <Button
          type="button"
          variant="ghost"
          onClick={() => router.push(backHref)}
          className="rounded-full border border-white/10 bg-white/10 px-4 py-2 text-white hover:bg-white/15"
        >
          <ArrowLeft className="h-4 w-4" />
          {t("common", "back")}
        </Button>

        {!vehicleData?.assignment ? (
          <SectionCard
            title={t("issues", "reportIssue")}
            icon={<CarFront className="h-5 w-5" />}
          >
            <p className="text-sm text-slate-300">
              {t("issues", "noAssignedVehicleReport")}
            </p>
          </SectionCard>
        ) : (
          <SectionCard
            title={t("issues", "reportIssue")}
            icon={<CarFront className="h-5 w-5" />}
          >
            <form onSubmit={handleSubmit} className="space-y-5">
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

              <IssueCategory
                title={t("issues", "serviceCategory")}
                icon={<Settings className="h-4 w-4" />}
              >
                <FormField label={t("issues", "serviceInKm")}>
                  <Input
                    value={needServiceInKm}
                    onChange={(event) => setNeedServiceInKm(event.target.value)}
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

                <PhotoUpload
                  files={serviceFiles}
                  label={t("issues", "addServicePhotos")}
                  addLabel={t("issues", "addPhotos")}
                  description={t("issues", "addPhotosDescription")}
                  onChange={(event) => handleFilesChange("service", event)}
                  onRemove={(index) => removeFile("service", index)}
                />
              </IssueCategory>

              <IssueCategory
                title={t("issues", "dashboardCategory")}
                icon={<Gauge className="h-4 w-4" />}
              >
                <FormField label={t("issues", "dashboardChecks")}>
                  <Textarea
                    value={dashboardChecks}
                    onChange={(event) => setDashboardChecks(event.target.value)}
                    placeholder={t("issues", "dashboardChecksPlaceholder")}
                  />
                </FormField>

                <PhotoUpload
                  files={dashboardFiles}
                  label={t("issues", "addDashboardPhotos")}
                  addLabel={t("issues", "addPhotos")}
                  description={t("issues", "addPhotosDescription")}
                  onChange={(event) => handleFilesChange("dashboard", event)}
                  onRemove={(index) => removeFile("dashboard", index)}
                />
              </IssueCategory>

              <IssueCategory
                title={t("issues", "otherProblemsCategory")}
                icon={<TriangleAlert className="h-4 w-4" />}
              >
                <FormField label={t("issues", "otherProblems")}>
                  <Textarea
                    value={otherProblems}
                    onChange={(event) => setOtherProblems(event.target.value)}
                    placeholder={t("issues", "otherProblemsPlaceholder")}
                  />
                </FormField>

                <PhotoUpload
                  files={otherFiles}
                  label={t("issues", "addOtherPhotos")}
                  addLabel={t("issues", "addPhotos")}
                  description={t("issues", "addPhotosDescription")}
                  onChange={(event) => handleFilesChange("other", event)}
                  onRemove={(index) => removeFile("other", index)}
                />
              </IssueCategory>

              <Button
                type="submit"
                disabled={loading}
                loading={loading}
                className="rounded-xl"
              >
                {t("issues", "sendIssue")}
              </Button>
            </form>
          </SectionCard>
        )}
      </div>
    </DataStateBoundary>
  );
}

function IssueCategory({
  title,
  icon,
  children,
}: {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-4 rounded-2xl border border-white/10 bg-black/10 p-4">
      <div className="flex items-center gap-2 border-b border-white/10 pb-3">
        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-white">
          {icon}
        </span>
        <h3 className="text-sm font-bold uppercase tracking-wide text-white">
          {title}
        </h3>
      </div>

      {children}
    </section>
  );
}

function PhotoUpload({
  files,
  label,
  addLabel,
  description,
  onChange,
  onRemove,
}: {
  files: File[];
  label: string;
  addLabel: string;
  description: string;
  onChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onRemove: (index: number) => void;
}) {
  return (
    <div className="space-y-2 rounded-xl border border-white/10 bg-white/5 p-3">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-white">{label}</p>
          <p className="text-xs text-slate-400">{description}</p>
        </div>

        <label className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-white/10 bg-white/10 px-3 py-2 text-xs font-semibold text-white transition hover:bg-white/15">
          <ImagePlus className="h-4 w-4" />
          {addLabel}
          <input
            type="file"
            accept="image/*"
            multiple
            onChange={onChange}
            className="hidden"
          />
        </label>
      </div>

      {files.length > 0 ? (
        <div className="space-y-1 pt-1">
          {files.map((file, index) => (
            <div
              key={`${file.name}-${index}`}
              className="flex items-center justify-between gap-2 rounded-lg border border-white/10 bg-black/20 px-3 py-1.5"
            >
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-white">
                  {file.name}
                </p>
                <p className="text-xs text-slate-400">
                  {(file.size / 1024 / 1024).toFixed(2)} MB
                </p>
              </div>

              <button
                type="button"
                onClick={() => onRemove(index)}
                className="rounded-full bg-red-500/10 p-2 text-red-200 hover:bg-red-500/20"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      ) : null}
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