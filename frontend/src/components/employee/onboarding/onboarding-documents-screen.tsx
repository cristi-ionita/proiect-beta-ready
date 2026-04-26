"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  CarFront,
  Check,
  FileText,
  IdCard,
  Trash2,
  Upload,
  X,
} from "lucide-react";

import Button from "@/components/ui/button";
import SectionCard from "@/components/ui/section-card";
import {
  deleteMyDocument,
  getMyDocuments,
  myDownloadDocumentFile,
  uploadMyDocument,
} from "@/services/documents.api";
import { formatDate } from "@/lib/utils";

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

  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [uploadingType, setUploadingType] =
    useState<RequiredDocumentType | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [preview, setPreview] = useState<PreviewState | null>(null);
  const [previewLoadingId, setPreviewLoadingId] = useState<number | null>(null);

  async function loadDocuments() {
    const data = await getMyDocuments();
    setDocuments(Array.isArray(data) ? data : []);
  }

  useEffect(() => {
    void loadDocuments();
  }, []);

  useEffect(() => {
    return () => {
      if (preview?.url) URL.revokeObjectURL(preview.url);
    };
  }, [preview]);

  const identityDocument = useMemo(() => {
    return (
      documents.find((doc) => {
        const type = String(doc.type || "").toUpperCase();
        return type === "ID_CARD" || type === "PASSPORT";
      }) || null
    );
  }, [documents]);

  const driverLicenseDocument = useMemo(() => {
    return (
      documents.find(
        (doc) => String(doc.type || "").toUpperCase() === "DRIVER_LICENSE"
      ) || null
    );
  }, [documents]);

  const canSave = Boolean(identityDocument && driverLicenseDocument);

  function getDocumentDate(document: DocumentItem) {
    const doc = document as DocumentWithDates;
    return doc.updated_at || doc.created_at || null;
  }

  function closePreview() {
    if (preview?.url) URL.revokeObjectURL(preview.url);
    setPreview(null);
  }

  async function handlePreview(document: DocumentItem) {
    try {
      setPreviewLoadingId(document.id);

      const blob = await myDownloadDocumentFile(document.id);
      const url = URL.createObjectURL(blob);

      if (preview?.url) URL.revokeObjectURL(preview.url);

      setPreview({
        url,
        fileName: document.file_name || "document",
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

      if (preview?.fileName === document.file_name) closePreview();

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
      <Button
        variant="ghost"
        onClick={() => router.push("/employee/onboarding")}
        className="rounded-full border border-white/10 bg-white/10 px-4 py-2 text-white hover:bg-white/15"
      >
        <ArrowLeft className="h-4 w-4" />
        Înapoi
      </Button>

      <SectionCard title="Documente obligatorii">
        <div className="space-y-4">
          <DocumentRow
            icon={<IdCard className="h-5 w-5" />}
            title="ID / Pașaport"
            description="Carte de identitate sau pașaport."
            document={identityDocument}
            loading={
              uploadingType === "ID_CARD" || uploadingType === "PASSPORT"
            }
            deleting={identityDocument ? deletingId === identityDocument.id : false}
            previewLoading={
              identityDocument
                ? previewLoadingId === identityDocument.id
                : false
            }
            date={
              identityDocument ? getDocumentDate(identityDocument) : null
            }
            onUpload={(file) => void handleUpload("ID_CARD", file)}
            onPreview={() => {
              if (identityDocument) void handlePreview(identityDocument);
            }}
            onDelete={() => {
              if (identityDocument) void handleDelete(identityDocument);
            }}
          />

          <DocumentRow
            icon={<CarFront className="h-5 w-5" />}
            title="Permis auto"
            description="Permisul de conducere."
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
            onUpload={(file) => void handleUpload("DRIVER_LICENSE", file)}
            onPreview={() => {
              if (driverLicenseDocument) void handlePreview(driverLicenseDocument);
            }}
            onDelete={() => {
              if (driverLicenseDocument) void handleDelete(driverLicenseDocument);
            }}
          />
        </div>
      </SectionCard>

      <div className="flex justify-end">
        <Button
          size="sm"
          disabled={!canSave}
          onClick={handleSave}
          className="rounded-full px-6"
        >
          <Check className="h-4 w-4" />
          Salvează
        </Button>
      </div>

      {preview ? (
        <SectionCard title={preview.fileName}>
          <div className="space-y-3">
            <div className="flex justify-end">
              <Button
                size="sm"
                variant="ghost"
                onClick={closePreview}
                className="rounded-full border border-white/10 bg-white/10 text-white hover:bg-white/15"
              >
                <X className="h-4 w-4" />
                Închide
              </Button>
            </div>

            <div className="overflow-hidden rounded-2xl border border-white/10 bg-black/30">
              <iframe
                src={preview.url}
                title={preview.fileName}
                className="h-[70vh] w-full"
              />
            </div>
          </div>
        </SectionCard>
      ) : null}
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
  onUpload: (file: File | null) => void;
  onPreview: () => void;
  onDelete: () => void;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-black/30 text-white">
            {icon}
          </div>

          <div>
            <button
              type="button"
              disabled={!document || previewLoading}
              onClick={onPreview}
              className="text-left font-semibold text-white hover:underline disabled:cursor-not-allowed disabled:opacity-60"
            >
              {previewLoading ? "Se deschide..." : title}
            </button>

            <p className="text-sm text-slate-400">{description}</p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <label className="inline-flex cursor-pointer items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-semibold text-slate-950 hover:bg-slate-100">
            <Upload className="h-4 w-4" />
            {loading ? "Se încarcă..." : "Încarcă"}

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

          {document ? (
            <Button
              size="sm"
              disabled={deleting}
              onClick={onDelete}
              className="rounded-full bg-red-600 text-white hover:bg-red-700"
            >
              <Trash2 className="h-4 w-4" />
              {deleting ? "Se șterge..." : "Șterge"}
            </Button>
          ) : null}
        </div>
      </div>

      {document ? (
        <button
          type="button"
          onClick={onPreview}
          disabled={previewLoading}
          className="mt-4 flex w-full items-center gap-3 rounded-xl border border-white/10 bg-black/20 px-3 py-3 text-left hover:bg-black/30 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-black/30 text-white">
            <FileText className="h-4 w-4" />
          </div>

          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-white">
              {document.file_name || "document"}
            </p>

            <p className="text-xs text-slate-400">
              {date ? `Încărcat la ${formatDate(date)}` : "Document încărcat"}
            </p>
          </div>
        </button>
      ) : null}
    </div>
  );
}