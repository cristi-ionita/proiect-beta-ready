"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Upload, FileText, User, Trash2, X } from "lucide-react";

import DataStateBoundary from "@/components/patterns/data-state-boundary";
import SectionCard from "@/components/ui/section-card";
import Button from "@/components/ui/button";
import ConfirmDialog from "@/components/ui/confirm-dialog";

import { useSafeI18n } from "@/hooks/use-safe-i18n";
import { useAdminUsersData } from "@/hooks/admin/use-admin-users-data";
import { useActiveUsersTableData } from "@/hooks/users/use-active-users-table-data";
import {
  getUserDocuments,
  adminUploadDocument,
  adminDownloadDocumentFile,
  adminDeleteDocument,
} from "@/services/documents.api";

import { formatDate } from "@/lib/utils";
import type { DocumentItem } from "@/types/document.types";

type Props = {
  userId: number;
};

type PreviewState = {
  url: string;
  fileName: string;
};

type DocumentWithDates = DocumentItem & {
  created_at?: string | null;
  updated_at?: string | null;
};

const TYPES = ["CONTRACT", "PAYSLIP"] as const;

export default function AdminCompanyDocumentsDetailsScreen({ userId }: Props) {
  const router = useRouter();
  const { t, localeTag } = useSafeI18n();
  const fileInputsRef = useRef<Record<string, HTMLInputElement | null>>({});

  const { data, loading: usersLoading, error } = useAdminUsersData();

  const usersData = useActiveUsersTableData(
    data.users,
    data.leaveRequests,
    data.assignments
  );

  const user = useMemo(
    () => usersData.find((item) => Number(item.id) === Number(userId)) || null,
    [usersData, userId]
  );

  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [documentsLoading, setDocumentsLoading] = useState(true);
  const [savingType, setSavingType] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<DocumentItem | null>(null);
  const [preview, setPreview] = useState<PreviewState | null>(null);
  const [previewLoadingId, setPreviewLoadingId] = useState<number | null>(null);

  async function loadDocuments() {
    setDocumentsLoading(true);

    try {
      const docsData = await getUserDocuments(userId);
      setDocuments(Array.isArray(docsData) ? docsData : []);
    } finally {
      setDocumentsLoading(false);
    }
  }

  useEffect(() => {
    if (userId) {
      void loadDocuments();
    }
  }, [userId]);

  useEffect(() => {
    return () => {
      if (preview?.url) {
        URL.revokeObjectURL(preview.url);
      }
    };
  }, [preview]);

  function closePreview() {
    if (preview?.url) {
      URL.revokeObjectURL(preview.url);
    }

    setPreview(null);
  }

  function getDocs(type: string) {
    return documents.filter(
      (document) => document.type?.toLowerCase() === type.toLowerCase()
    );
  }

  function getDoc(type: string) {
    return getDocs(type)[0] || null;
  }

  function getLabel(type: string) {
    return type === "CONTRACT"
      ? t("documents", "contract")
      : t("documents", "payslip");
  }

  function getUploadLabel(type: string, hasDocument: boolean) {
    if (type === "CONTRACT") {
      return hasDocument
        ? t("documents", "replaceContract")
        : t("documents", "uploadContract");
    }

    return t("documents", "uploadPayslip");
  }

  function getDocumentDate(document: DocumentItem) {
    const documentWithDates = document as DocumentWithDates;
    return documentWithDates.updated_at || documentWithDates.created_at || null;
  }

  async function handlePreview(document: DocumentItem) {
    try {
      setPreviewLoadingId(document.id);

      const blob = await adminDownloadDocumentFile(document.id);
      const url = URL.createObjectURL(blob);

      if (preview?.url) {
        URL.revokeObjectURL(preview.url);
      }

      setPreview({
        url,
        fileName: document.file_name || "document",
      });
    } finally {
      setPreviewLoadingId(null);
    }
  }

  async function handleUpload(type: string, file: File | null) {
    if (!file) return;

    try {
      setSavingType(type);

      const form = new FormData();
      form.append("type", type);
      form.append("category", "COMPANY");
      form.append("file", file);

      await adminUploadDocument(userId, form);
      await loadDocuments();
    } finally {
      setSavingType(null);

      const input = fileInputsRef.current[type];
      if (input) input.value = "";
    }
  }

  async function handleDeleteConfirmed() {
    if (!confirmDelete) return;

    try {
      setDeletingId(confirmDelete.id);
      await adminDeleteDocument(confirmDelete.id);
      closePreview();
      await loadDocuments();
    } finally {
      setDeletingId(null);
      setConfirmDelete(null);
    }
  }

  function renderDocumentList(type: "CONTRACT" | "PAYSLIP") {
    const docs = type === "CONTRACT" ? getDocs(type).slice(0, 1) : getDocs(type);

    if (docs.length === 0) {
      return (
        <p className="truncate text-sm text-slate-400">
          {t("documents", "noFile")}
        </p>
      );
    }

    return (
      <div className="mt-3 space-y-2">
        {docs.map((document) => {
          const isDeleting = deletingId === document.id;
          const isPreviewLoading = previewLoadingId === document.id;
          const date = getDocumentDate(document);

          return (
            <div
              key={document.id}
              className="flex flex-col gap-2 rounded-xl border border-white/10 bg-black/20 px-3 py-2 md:flex-row md:items-center md:justify-between"
            >
              <button
                type="button"
                disabled={isPreviewLoading}
                onClick={() => void handlePreview(document)}
                className="min-w-0 truncate text-left text-sm font-medium text-white hover:underline disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isPreviewLoading
                  ? t("documents", "opening")
                  : document.file_name}
              </button>

              <div className="flex shrink-0 items-center gap-2">
                {date ? (
                  <span className="text-xs text-slate-400">
                    {formatDate(date, localeTag)}
                  </span>
                ) : null}

                <Button
                  size="sm"
                  disabled={isDeleting}
                  onClick={() => setConfirmDelete(document)}
                  className="rounded-full bg-red-600 text-white hover:bg-red-700"
                >
                  <Trash2 className="h-4 w-4" />
                  {isDeleting
                    ? t("documents", "deleting")
                    : t("common", "delete")}
                </Button>
              </div>
            </div>
          );
        })}
      </div>
    );
  }

  return (
    <DataStateBoundary
      isLoading={usersLoading || documentsLoading}
      isError={Boolean(error)}
      errorMessage={error ?? t("documents", "failedToLoadData")}
    >
      <div className="space-y-6">
        <Button
          variant="ghost"
          onClick={() => router.push("/admin/documents/company-documents")}
          className="rounded-full border border-white/10 bg-white/10 px-4 py-2 text-white backdrop-blur-md hover:bg-white/15"
        >
          <ArrowLeft className="h-4 w-4" />
          {t("common", "back")}
        </Button>

        <SectionCard title={t("documents", "user")}>
          {user ? (
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-black/30">
                <User className="h-4 w-4 text-white" />
              </div>

              <div>
                <p className="font-semibold text-white">{user.full_name}</p>
                <p className="text-sm text-slate-400">
                  {t("common", "shift")}: {user.shift_number || "—"}
                </p>
              </div>
            </div>
          ) : (
            <p className="text-slate-400">{t("documents", "userNotFound")}</p>
          )}
        </SectionCard>

        <SectionCard title={t("documents", "documents")}>
          <div className="space-y-3">
            {TYPES.map((type) => {
              const document = getDoc(type);
              const isSaving = savingType === type;

              return (
                <div
                  key={type}
                  className="flex flex-col gap-4 rounded-2xl border border-white/10 bg-white/5 p-4 md:flex-row md:items-start md:justify-between"
                >
                  <div className="flex min-w-0 flex-1 items-start gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-black/30">
                      <FileText className="h-4 w-4 text-white" />
                    </div>

                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-white">
                        {getLabel(type)}
                      </p>
                      {renderDocumentList(type)}
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2 md:justify-end">
                    <input
                      type="file"
                      ref={(element) => {
                        fileInputsRef.current[type] = element;
                      }}
                      onChange={(event) =>
                        void handleUpload(type, event.target.files?.[0] || null)
                      }
                      disabled={isSaving}
                      className="hidden"
                    />

                    <Button
                      size="sm"
                      disabled={isSaving}
                      className="rounded-full"
                      onClick={() => fileInputsRef.current[type]?.click()}
                    >
                      <Upload className="h-4 w-4" />
                      {isSaving
                        ? t("documents", "uploading")
                        : getUploadLabel(type, Boolean(document))}
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        </SectionCard>

        {preview ? (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 px-4 py-8">
            <button
              type="button"
              onClick={closePreview}
              className="absolute right-6 top-6 rounded-full bg-black/70 p-3 text-white transition hover:bg-black"
              aria-label={t("documents", "close")}
            >
              <X className="h-5 w-5" />
            </button>

            <div className="max-h-[88vh] w-full max-w-4xl overflow-hidden rounded-2xl border border-white/10 bg-slate-900 shadow-2xl">
              <div className="border-b border-white/10 px-4 py-3">
                <p className="truncate text-sm font-semibold text-white">
                  {preview.fileName}
                </p>
              </div>

              <iframe
                src={preview.url}
                title={preview.fileName}
                className="h-[78vh] w-full bg-black"
              />
            </div>
          </div>
        ) : null}

        <ConfirmDialog
          open={Boolean(confirmDelete)}
          title={t("documents", "deleteDocumentTitle")}
          message={`${t("documents", "confirmDeleteDocument")}${
            confirmDelete?.file_name ? `\n${confirmDelete.file_name}` : ""
          }`}
          confirmText={t("common", "delete")}
          cancelText={t("common", "cancel")}
          loading={Boolean(confirmDelete && deletingId === confirmDelete.id)}
          loadingText={t("documents", "deleting")}
          onConfirm={() => void handleDeleteConfirmed()}
          onCancel={() => setConfirmDelete(null)}
        />
      </div>
    </DataStateBoundary>
  );
}