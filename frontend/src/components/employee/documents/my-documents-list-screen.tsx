"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, CalendarDays, FileText, Upload, X } from "lucide-react";

import DataStateBoundary from "@/components/patterns/data-state-boundary";
import Button from "@/components/ui/button";
import SectionCard from "@/components/ui/section-card";
import { ROUTES } from "@/constants/routes";
import { useMyDocuments } from "@/hooks/documents/use-my-documents";
import { useSafeI18n } from "@/hooks/use-safe-i18n";
import {
  deleteMyDocument,
  myDownloadDocumentFile,
  uploadMyDocument,
} from "@/services/documents.api";

type UniqueDocumentSlot = {
  key: string;
  labelKey:
    | "driverLicense"
    | "identityDocument"
    | "taxNumber"
    | "bankCard";
  types: string[];
  uploadType: string;
};

const UNIQUE_DOCUMENT_SLOTS: UniqueDocumentSlot[] = [
  {
    key: "driver_license",
    labelKey: "driverLicense",
    types: ["driver_license"],
    uploadType: "DRIVER_LICENSE",
  },
  {
    key: "identity",
    labelKey: "identityDocument",
    types: ["id_card", "passport"],
    uploadType: "ID_CARD",
  },
  {
    key: "tax_number",
    labelKey: "taxNumber",
    types: ["tax_number"],
    uploadType: "TAX_NUMBER",
  },
  {
    key: "bank_card",
    labelKey: "bankCard",
    types: ["bank_card"],
    uploadType: "BANK_CARD",
  },
];

function formatDate(value?: string | null) {
  if (!value) return "—";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return new Intl.DateTimeFormat("ro-RO", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

export default function MyDocumentsListScreen() {
  const router = useRouter();
  const { t } = useSafeI18n();
  const fileInputsRef = useRef<Record<string, HTMLInputElement | null>>({});

  const { data, loading, error, refetch } = useMyDocuments();

  const [preview, setPreview] = useState<string | null>(null);
  const [uploadingKey, setUploadingKey] = useState<string | null>(null);

  const documents = Array.isArray(data) ? data : [];
  const personalDocuments = documents.filter(
    (document) => document.category === "personal"
  );

  const medicalDocuments = personalDocuments.filter(
    (document) => document.type === "medical_certificate"
  );

  function getDocumentForSlot(slot: UniqueDocumentSlot) {
    return personalDocuments.find((document) =>
      slot.types.includes(document.type)
    );
  }

  async function handlePreview(documentId: number) {
    const blob = await myDownloadDocumentFile(documentId);
    const url = URL.createObjectURL(blob);

    setPreview(url);
  }

  function closePreview() {
    if (preview) {
      URL.revokeObjectURL(preview);
    }

    setPreview(null);
  }

  async function handleUniqueUpload(
    slot: UniqueDocumentSlot,
    file: File | null
  ) {
    if (!file) return;

    const existingDocument = getDocumentForSlot(slot);

    try {
      setUploadingKey(slot.key);

      if (existingDocument) {
        await deleteMyDocument(existingDocument.id);
      }

      const form = new FormData();
      form.append("type", slot.uploadType);
      form.append("file", file);

      await uploadMyDocument(form);
      await refetch();
    } finally {
      setUploadingKey(null);

      const input = fileInputsRef.current[slot.key];
      if (input) {
        input.value = "";
      }
    }
  }

  async function handleMedicalUpload(file: File | null) {
    if (!file) return;

    try {
      setUploadingKey("medical_certificate");

      const form = new FormData();
      form.append("type", "MEDICAL_CERTIFICATE");
      form.append("file", file);

      await uploadMyDocument(form);
      await refetch();
    } finally {
      setUploadingKey(null);

      const input = fileInputsRef.current.medical_certificate;
      if (input) {
        input.value = "";
      }
    }
  }

  return (
    <DataStateBoundary
      isLoading={loading}
      isError={Boolean(error)}
      errorMessage={error ?? t("documents", "failedToLoadDocuments")}
    >
      <div className="space-y-4">
        <Button
          variant="ghost"
          onClick={() => router.push(ROUTES.EMPLOYEE.DOCUMENTS)}
          className="rounded-full border border-white/10 bg-white/10 px-4 py-2 text-white"
        >
          <ArrowLeft className="h-4 w-4" />
          {t("common", "back")}
        </Button>

        <div className="overflow-hidden rounded-[26px] border border-white/10 bg-white/10 backdrop-blur-md">
          <div className="divide-y divide-white/10">
            {UNIQUE_DOCUMENT_SLOTS.map((slot) => {
              const document = getDocumentForSlot(slot);
              const isUploading = uploadingKey === slot.key;

              return (
                <div
                  key={slot.key}
                  className="flex flex-col gap-3 px-4 py-3 hover:bg-white/5 md:flex-row md:items-center md:justify-between"
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-black/30 text-white">
                      <FileText className="h-4 w-4" />
                    </div>

                    <div className="min-w-0">
                      <p className="text-xs font-semibold uppercase text-slate-400">
                        {t("documents", slot.labelKey)}
                      </p>

                      {document ? (
                        <>
                          <button
                            type="button"
                            onClick={() => void handlePreview(document.id)}
                            className="block max-w-full truncate text-left text-sm font-semibold text-white hover:underline"
                          >
                            {document.file_name}
                          </button>

                          <div className="mt-1 flex items-center gap-2 text-xs text-slate-400">
                            <CalendarDays className="h-3.5 w-3.5" />
                            {formatDate(document.created_at)}
                          </div>
                        </>
                      ) : (
                        <p className="text-sm text-slate-400">
                          {t("documents", "missingDocument")}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex justify-end">
                    <input
                      type="file"
                      accept=".pdf,.jpg,.jpeg,.png"
                      ref={(element) => {
                        fileInputsRef.current[slot.key] = element;
                      }}
                      disabled={isUploading}
                      onChange={(event) =>
                        void handleUniqueUpload(
                          slot,
                          event.target.files?.[0] || null
                        )
                      }
                      className="hidden"
                    />

                    <Button
                      size="sm"
                      className="rounded-full"
                      disabled={isUploading}
                      loading={isUploading}
                      onClick={() => fileInputsRef.current[slot.key]?.click()}
                    >
                      <Upload className="h-4 w-4" />
                      {document
                        ? t("documents", "replaceDocument")
                        : t("documents", "addDocument")}
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <SectionCard title={t("documents", "medicalLeaves")}>
          <div className="space-y-3">
            <div className="flex justify-end">
              <input
                type="file"
                accept=".pdf,.jpg,.jpeg,.png"
                ref={(element) => {
                  fileInputsRef.current.medical_certificate = element;
                }}
                disabled={uploadingKey === "medical_certificate"}
                onChange={(event) =>
                  void handleMedicalUpload(event.target.files?.[0] || null)
                }
                className="hidden"
              />

              <Button
                size="sm"
                className="rounded-full"
                disabled={uploadingKey === "medical_certificate"}
                loading={uploadingKey === "medical_certificate"}
                onClick={() => fileInputsRef.current.medical_certificate?.click()}
              >
                <Upload className="h-4 w-4" />
                {t("documents", "addMedicalLeave")}
              </Button>
            </div>

            {medicalDocuments.length === 0 ? (
              <p className="text-sm text-slate-400">
                {t("documents", "noMedicalLeaves")}
              </p>
            ) : (
              <div className="overflow-hidden rounded-[22px] border border-white/10 bg-white/5">
                <div className="divide-y divide-white/10">
                  {medicalDocuments.map((document) => (
                    <div
                      key={document.id}
                      className="flex flex-col gap-3 px-4 py-3 hover:bg-white/5 md:flex-row md:items-center md:justify-between"
                    >
                      <div className="flex min-w-0 items-center gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-black/30 text-white">
                          <FileText className="h-4 w-4" />
                        </div>

                        <div className="min-w-0">
                          <p className="text-xs font-semibold uppercase text-slate-400">
                            {t("documents", "medicalLeave")}
                          </p>

                          <button
                            type="button"
                            onClick={() => void handlePreview(document.id)}
                            className="block max-w-full truncate text-left text-sm font-semibold text-white hover:underline"
                          >
                            {document.file_name}
                          </button>

                          <div className="mt-1 flex items-center gap-2 text-xs text-slate-400">
                            <CalendarDays className="h-3.5 w-3.5" />
                            {formatDate(document.created_at)}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </SectionCard>

        {preview ? (
          <SectionCard>
            <div className="space-y-3">
              <div className="flex justify-end">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={closePreview}
                  className="rounded-full border border-white/10 bg-white/10 text-white"
                >
                  <X className="h-4 w-4" />
                  {t("documents", "close")}
                </Button>
              </div>

              <div className="overflow-hidden rounded-2xl border border-white/10 bg-black/30">
                <iframe src={preview} className="h-[70vh] w-full" />
              </div>
            </div>
          </SectionCard>
        ) : null}
      </div>
    </DataStateBoundary>
  );
}