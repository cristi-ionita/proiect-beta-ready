"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, CalendarDays, FileText, Upload } from "lucide-react";

import DataStateBoundary from "@/components/patterns/data-state-boundary";
import ListChip from "@/components/patterns/list-chip";
import ListRow from "@/components/patterns/list-row";
import AppModal from "@/components/ui/app-modal";
import Button from "@/components/ui/button";
import SectionCard from "@/components/ui/section-card";
import { ROUTES } from "@/constants/routes";
import { useMyDocuments } from "@/hooks/documents/use-my-documents";
import { useSafeI18n } from "@/hooks/use-safe-i18n";
import { formatDate } from "@/lib/utils";
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
  const { t, localeTag } = useSafeI18n();
  const fileInputsRef = useRef<Record<string, HTMLInputElement | null>>({});

  const { data, loading, error, refetch } = useMyDocuments();

  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewName, setPreviewName] = useState("");
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

  async function handlePreview(documentId: number, fileName?: string | null) {
    const blob = await myDownloadDocumentFile(documentId);
    const url = URL.createObjectURL(blob);

    setPreviewUrl((current) => {
      if (current) URL.revokeObjectURL(current);
      return url;
    });

    setPreviewName(fileName || "document");
  }

  function closePreview() {
    setPreviewUrl((current) => {
      if (current) URL.revokeObjectURL(current);
      return null;
    });

    setPreviewName("");
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
      if (input) input.value = "";
    }
  }

  return (
    <div className="space-y-4">
      <Button
        variant="back"
        onClick={() => router.push(ROUTES.EMPLOYEE.DOCUMENTS)}
      >
        <ArrowLeft className="h-4 w-4" />
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
                <ListRow
                  key={slot.key}
                  leading={<FileText className="h-4 w-4" />}
                  title={t("documents", slot.labelKey)}
                  subtitle={
                    document
                      ? document.file_name || "document"
                      : t("documents", "missingDocument")
                  }
                  meta={
                    document ? (
                      <ListChip icon={<CalendarDays className="h-3 w-3" />}>
                        {formatDate(document.created_at, localeTag)}
                      </ListChip>
                    ) : undefined
                  }
                  actions={
                    <div className="flex flex-wrap justify-end gap-2">
                      {document ? (
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() =>
                            void handlePreview(document.id, document.file_name)
                          }
                        >
                          {t("documents", "viewDocument")}
                        </Button>
                      ) : null}

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
                        disabled={isUploading}
                        loading={isUploading}
                        onClick={() =>
                          fileInputsRef.current[slot.key]?.click()
                        }
                      >
                        <Upload className="h-4 w-4" />
                        {document
                          ? t("documents", "replaceDocument")
                          : t("documents", "addDocument")}
                      </Button>
                    </div>
                  }
                />
              );
            })}
          </div>
        </SectionCard>

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
                disabled={uploadingKey === "medical_certificate"}
                loading={uploadingKey === "medical_certificate"}
                onClick={() =>
                  fileInputsRef.current.medical_certificate?.click()
                }
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
              <div className="space-y-2.5">
                {medicalDocuments.map((document) => (
                  <ListRow
                    key={document.id}
                    leading={<FileText className="h-4 w-4" />}
                    title={document.file_name || "document"}
                    subtitle={t("documents", "medicalLeave")}
                    meta={
                      <ListChip icon={<CalendarDays className="h-3 w-3" />}>
                        {formatDate(document.created_at, localeTag)}
                      </ListChip>
                    }
                    actions={
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() =>
                          void handlePreview(document.id, document.file_name)
                        }
                      >
                        {t("documents", "viewDocument")}
                      </Button>
                    }
                  />
                ))}
              </div>
            )}
          </div>
        </SectionCard>
      </DataStateBoundary>

      <AppModal
        open={Boolean(previewUrl)}
        onClose={closePreview}
        title={previewName}
      >
        {previewUrl ? (
          <iframe
            src={previewUrl}
            title={previewName}
            className="h-[70vh] w-full rounded-xl bg-white"
          />
        ) : null}
      </AppModal>
    </div>
  );
}