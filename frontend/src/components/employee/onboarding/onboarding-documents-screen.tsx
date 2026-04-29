"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  CalendarDays,
  CarFront,
  Check,
  FileText,
  IdCard,
  Trash2,
  Upload,
} from "lucide-react";

import DataStateBoundary from "@/components/patterns/data-state-boundary";
import ListChip from "@/components/patterns/list-chip";
import ListRow from "@/components/patterns/list-row";
import AppModal from "@/components/ui/app-modal";
import Button from "@/components/ui/button";
import SectionCard from "@/components/ui/section-card";
import { useSafeI18n } from "@/hooks/use-safe-i18n";
import { formatDate } from "@/lib/utils";
import {
  deleteMyDocument,
  getMyDocuments,
  myDownloadDocumentFile,
  uploadMyDocument,
} from "@/services/documents.api";
import type { DocumentItem } from "@/types/document.types";

type RequiredDocumentType = "ID_CARD" | "PASSPORT" | "DRIVER_LICENSE";

type PreviewState = {
  url: string;
  fileName: string;
};

type DocumentWithDates = DocumentItem & {
  created_at?: string | null;
  updated_at?: string | null;
};

export default function OnboardingDocumentsScreen() {
  const router = useRouter();
  const { t, localeTag } = useSafeI18n();

  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploadingType, setUploadingType] =
    useState<RequiredDocumentType | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [preview, setPreview] = useState<PreviewState | null>(null);
  const [previewLoadingId, setPreviewLoadingId] = useState<number | null>(null);

  async function loadDocuments() {
    try {
      setLoading(true);

      const data = await getMyDocuments();
      setDocuments(Array.isArray(data) ? data : []);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadDocuments();
  }, []);

  useEffect(() => {
    return () => {
      setPreview((current) => {
        if (current?.url) URL.revokeObjectURL(current.url);
        return null;
      });
    };
  }, []);

  const identityDocument = useMemo(() => {
    return (
      documents.find((document) => {
        const type = String(document.type || "").toUpperCase();
        return type === "ID_CARD" || type === "PASSPORT";
      }) ?? null
    );
  }, [documents]);

  const driverLicenseDocument = useMemo(() => {
    return (
      documents.find(
        (document) =>
          String(document.type || "").toUpperCase() === "DRIVER_LICENSE"
      ) ?? null
    );
  }, [documents]);

  const canSave = Boolean(identityDocument && driverLicenseDocument);

  function getDocumentDate(document: DocumentItem) {
    const currentDocument = document as DocumentWithDates;
    return currentDocument.updated_at || currentDocument.created_at || null;
  }

  function closePreview() {
    setPreview((current) => {
      if (current?.url) URL.revokeObjectURL(current.url);
      return null;
    });
  }

  async function handlePreview(document: DocumentItem) {
    try {
      setPreviewLoadingId(document.id);

      const blob = await myDownloadDocumentFile(document.id);
      const url = URL.createObjectURL(blob);

      setPreview((current) => {
        if (current?.url) URL.revokeObjectURL(current.url);

        return {
          url,
          fileName: document.file_name || "document",
        };
      });
    } finally {
      setPreviewLoadingId(null);
    }
  }

  async function handleUpload(type: RequiredDocumentType, file: File | null) {
    if (!file) return;

    try {
      setUploadingType(type);

      const form = new FormData();
      form.append("type", type);
      form.append("file", file);

      await uploadMyDocument(form);
      await loadDocuments();
    } finally {
      setUploadingType(null);
    }
  }

  async function handleDelete(document: DocumentItem) {
    try {
      setDeletingId(document.id);

      await deleteMyDocument(document.id);

      if (preview?.fileName === document.file_name) {
        closePreview();
      }

      await loadDocuments();
    } finally {
      setDeletingId(null);
    }
  }

  function handleSave() {
    if (!canSave) return;
    router.push("/employee/onboarding");
  }

  return (
    <div className="space-y-6">
      <Button variant="back" onClick={() => router.push("/employee/onboarding")}>
        <ArrowLeft className="h-4 w-4" />
        {t("common", "back")}
      </Button>

      <DataStateBoundary isLoading={loading} isError={false}>
        <SectionCard title={t("documents", "uploadDocuments")}>
          <div className="space-y-3">
            <DocumentRow
              icon={<IdCard className="h-4 w-4" />}
              title={t("documents", "identityDocument")}
              description={t("documents", "identityDocument")}
              document={identityDocument}
              loading={uploadingType === "ID_CARD" || uploadingType === "PASSPORT"}
              deleting={identityDocument ? deletingId === identityDocument.id : false}
              previewLoading={
                identityDocument ? previewLoadingId === identityDocument.id : false
              }
              date={identityDocument ? getDocumentDate(identityDocument) : null}
              localeTag={localeTag}
              onUpload={(file) => void handleUpload("ID_CARD", file)}
              onPreview={() => {
                if (identityDocument) void handlePreview(identityDocument);
              }}
              onDelete={() => {
                if (identityDocument) void handleDelete(identityDocument);
              }}
            />

            <DocumentRow
              icon={<CarFront className="h-4 w-4" />}
              title={t("documents", "driverLicense")}
              description={t("documents", "driverLicense")}
              document={driverLicenseDocument}
              loading={uploadingType === "DRIVER_LICENSE"}
              deleting={
                driverLicenseDocument
                  ? deletingId === driverLicenseDocument.id
                  : false
              }
              previewLoading={
                driverLicenseDocument
                  ? previewLoadingId === driverLicenseDocument.id
                  : false
              }
              date={
                driverLicenseDocument
                  ? getDocumentDate(driverLicenseDocument)
                  : null
              }
              localeTag={localeTag}
              onUpload={(file) => void handleUpload("DRIVER_LICENSE", file)}
              onPreview={() => {
                if (driverLicenseDocument) {
                  void handlePreview(driverLicenseDocument);
                }
              }}
              onDelete={() => {
                if (driverLicenseDocument) {
                  void handleDelete(driverLicenseDocument);
                }
              }}
            />
          </div>
        </SectionCard>
      </DataStateBoundary>

      <div className="flex justify-end">
        <Button size="sm" disabled={!canSave} onClick={handleSave}>
          <Check className="h-4 w-4" />
          {t("common", "save")}
        </Button>
      </div>

      <AppModal
        open={Boolean(preview)}
        onClose={closePreview}
        title={preview?.fileName}
      >
        {preview ? (
          <iframe
            src={preview.url}
            title={preview.fileName}
            className="h-[70vh] w-full rounded-xl bg-white"
          />
        ) : null}
      </AppModal>
    </div>
  );
}

function DocumentRow({
  icon,
  title,
  description,
  document,
  loading,
  deleting,
  previewLoading,
  date,
  localeTag,
  onUpload,
  onPreview,
  onDelete,
}: {
  icon: ReactNode;
  title: string;
  description: string;
  document: DocumentItem | null;
  loading: boolean;
  deleting: boolean;
  previewLoading: boolean;
  date: string | null;
  localeTag: string;
  onUpload: (file: File | null) => void;
  onPreview: () => void;
  onDelete: () => void;
}) {
  const { t } = useSafeI18n();

  return (
    <ListRow
      leading={icon}
      title={title}
      subtitle={document ? document.file_name || "document" : description}
      meta={
        document ? (
          <ListChip icon={<CalendarDays className="h-3 w-3" />}>
            {date ? formatDate(date, localeTag) : t("documents", "viewDocument")}
          </ListChip>
        ) : (
          <ListChip>{t("documents", "missingDocument")}</ListChip>
        )
      }
      actions={
        <div className="flex flex-wrap justify-end gap-2">
          {document ? (
            <>
              <Button
                size="sm"
                variant="secondary"
                disabled={previewLoading}
                loading={previewLoading}
                onClick={onPreview}
              >
                <FileText className="h-4 w-4" />
                {t("documents", "viewDocument")}
              </Button>

              <Button
                size="sm"
                variant="danger"
                disabled={deleting}
                loading={deleting}
                onClick={onDelete}
              >
                <Trash2 className="h-4 w-4" />
                {t("common", "delete")}
              </Button>
            </>
          ) : null}

          <label
            className={[
              "inline-flex h-9 items-center justify-center gap-2 rounded-xl px-3 text-sm font-semibold transition",
              loading
                ? "cursor-not-allowed bg-white/60 text-slate-500"
                : "cursor-pointer bg-white text-slate-950 hover:bg-slate-100",
            ].join(" ")}
          >
            <Upload className="h-4 w-4" />
            {loading
              ? t("common", "loading")
              : document
                ? t("documents", "replaceDocument")
                : t("documents", "addDocument")}

            <input
              type="file"
              accept=".pdf,.jpg,.jpeg,.png"
              disabled={loading}
              onChange={(event) => {
                onUpload(event.target.files?.[0] || null);
                event.currentTarget.value = "";
              }}
              className="hidden"
            />
          </label>
        </div>
      }
    />
  );
}