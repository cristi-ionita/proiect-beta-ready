"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { FileText, Plus } from "lucide-react";

import DataStateBoundary from "@/components/patterns/data-state-boundary";
import AppModal from "@/components/ui/app-modal";
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
  labelKey: "driverLicense" | "identityDocument" | "taxNumber" | "bankCard";
  types: string[];
  uploadType: string;
};

type PreviewState = {
  url: string;
  type: string;
  fileName: string;
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

export default function MyDocumentsListScreen() {
  const router = useRouter();
  const { t } = useSafeI18n();
  const fileInputsRef = useRef<Record<string, HTMLInputElement | null>>({});

  const { data, loading, error, refetch } = useMyDocuments();

  const [preview, setPreview] = useState<PreviewState | null>(null);
  const [uploadingKey, setUploadingKey] = useState<string | null>(null);

  const documents = Array.isArray(data) ? data : [];
  const personalDocuments = documents.filter(
    (document) => document.category === "personal"
  );

  const otherDocuments = personalDocuments.filter(
    (document) => document.type === "medical_certificate"
  );

  function getDocumentForSlot(slot: UniqueDocumentSlot) {
    return personalDocuments.find((document) =>
      slot.types.includes(document.type)
    );
  }

  async function handlePreview(documentId: number, fileName?: string | null) {
    const blob = await myDownloadDocumentFile(documentId);
    const url = URL.createObjectURL(blob);

    setPreview((current) => {
      if (current?.url) URL.revokeObjectURL(current.url);

      return {
        url,
        type: blob.type,
        fileName: fileName || "document",
      };
    });
  }

  function closePreview() {
    setPreview((current) => {
      if (current?.url) URL.revokeObjectURL(current.url);
      return null;
    });
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
      if (input) input.value = "";
    }
  }

  async function handleOtherUpload(file: File | null) {
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
      if (input) input.value = "";
    }
  }

  return (
    <div className="space-y-4">
      <Button
        variant="back"
        onClick={() => router.push(ROUTES.EMPLOYEE.DOCUMENTS)}
      >
        {t("common", "back")}
      </Button>

      <DataStateBoundary
        isLoading={loading}
        isError={Boolean(error)}
        errorMessage={error ?? t("documents", "failedToLoadDocuments")}
      >
        <SectionCard title={t("documents", "userDocuments")}>
          <div className="space-y-3">
            {UNIQUE_DOCUMENT_SLOTS.map((slot) => {
              const document = getDocumentForSlot(slot);
              const isUploading = uploadingKey === slot.key;

              return (
                <div
                  key={slot.key}
                  className="flex items-center gap-3 rounded-3xl border border-white/10 bg-white/10 p-4"
                >
                  <div
                    role={document ? "button" : undefined}
                    tabIndex={document ? 0 : undefined}
                    onClick={
                      document
                        ? () => void handlePreview(document.id, document.file_name)
                        : undefined
                    }
                    onKeyDown={(event) => {
                      if (!document) return;
                      if (event.key === "Enter" || event.key === " ") {
                        event.preventDefault();
                        void handlePreview(document.id, document.file_name);
                      }
                    }}
                    className="flex min-w-0 flex-1 cursor-pointer items-center gap-3"
                  >
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-black/60 text-white">
                      <FileText className="h-4 w-4" />
                    </div>

                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-bold text-white">
                        {t("documents", slot.labelKey)}
                      </p>

                      <p className="mt-0.5 truncate text-xs text-slate-400">
                        {document
                          ? document.file_name || "document"
                          : t("documents", "missingDocument")}
                      </p>
                    </div>
                  </div>

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
                    className="flex h-9 w-9 shrink-0 items-center justify-center p-0"
                    disabled={isUploading}
                    loading={isUploading}
                    onClick={() => fileInputsRef.current[slot.key]?.click()}
                    aria-label={
                      document
                        ? t("documents", "replaceDocument")
                        : t("documents", "addDocument")
                    }
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              );
            })}
          </div>
        </SectionCard>

        <SectionCard title="Alte documente">
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
                  void handleOtherUpload(event.target.files?.[0] || null)
                }
                className="hidden"
              />

              <Button
                size="sm"
                className="flex h-9 w-9 items-center justify-center p-0"
                disabled={uploadingKey === "medical_certificate"}
                loading={uploadingKey === "medical_certificate"}
                onClick={() => fileInputsRef.current.medical_certificate?.click()}
                aria-label="Adaugă document"
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>

            {otherDocuments.length === 0 ? (
              <p className="text-sm text-slate-400">
                Nu există alte documente încărcate.
              </p>
            ) : (
              <div className="space-y-2.5">
                {otherDocuments.map((document) => (
                  <button
                    key={document.id}
                    type="button"
                    onClick={() =>
                      void handlePreview(document.id, document.file_name)
                    }
                    className="flex w-full items-center gap-3 rounded-3xl border border-white/10 bg-white/10 p-4 text-left transition hover:bg-white/15"
                  >
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-black/60 text-white">
                      <FileText className="h-4 w-4" />
                    </div>

                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-bold text-white">
                        {document.file_name || "document"}
                      </p>

                      <p className="mt-0.5 text-xs text-slate-400">
                        Alt document
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </SectionCard>
      </DataStateBoundary>

      <AppModal
        open={Boolean(preview)}
        onClose={closePreview}
        title={preview?.fileName}
      >
        {preview ? (
          preview.type.includes("image") ? (
            <img
              src={preview.url}
              alt={preview.fileName}
              className="max-h-[70vh] w-full rounded-xl object-contain"
            />
          ) : (
            <iframe
              src={preview.url}
              title={preview.fileName}
              className="h-[70vh] w-full rounded-xl bg-white"
            />
          )
        ) : null}
      </AppModal>
    </div>
  );
}