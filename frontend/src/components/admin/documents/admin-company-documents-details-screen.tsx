"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, CalendarDays, FileText, Trash2, Upload, User } from "lucide-react";

import DataStateBoundary from "@/components/patterns/data-state-boundary";
import ListChip from "@/components/patterns/list-chip";
import ListRow from "@/components/patterns/list-row";
import AppModal from "@/components/ui/app-modal";
import Button from "@/components/ui/button";
import ConfirmDialog from "@/components/ui/confirm-dialog";
import SectionCard from "@/components/ui/section-card";
import { useSafeI18n } from "@/hooks/use-safe-i18n";
import { useActiveUsersTableData } from "@/hooks/users/use-active-users-table-data";
import { useAdminUsersData } from "@/hooks/users/use-admin-users-data";
import { formatDate } from "@/lib/utils";
import {
  adminDeleteDocument,
  adminDownloadDocumentFile,
  adminUploadDocument,
  getUserDocuments,
} from "@/services/documents.api";
import {
  DOCUMENT_CATEGORY,
  DOCUMENT_TYPE,
  type DocumentItem,
  type DocumentType,
} from "@/types/document.types";

type Props = {
  userId: number;
};

type PreviewState = {
  url: string;
  fileName: string;
};

const DOCUMENT_TYPES = [DOCUMENT_TYPE.CONTRACT, DOCUMENT_TYPE.PAYSLIP] as const;

export default function AdminCompanyDocumentsDetailsScreen({ userId }: Props) {
  const router = useRouter();
  const { t, localeTag } = useSafeI18n();

  const fileInputsRef = useRef<
    Partial<Record<DocumentType, HTMLInputElement | null>>
  >({});

  const { data, loading: usersLoading, error: usersError } = useAdminUsersData();

  const usersData = useActiveUsersTableData(
    data.users,
    data.leaveRequests,
    data.assignments
  );

  const user = useMemo(
    () => usersData.find((item) => Number(item.id) === Number(userId)) ?? null,
    [usersData, userId]
  );

  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [documentsLoading, setDocumentsLoading] = useState(true);
  const [documentsError, setDocumentsError] = useState(false);
  const [savingType, setSavingType] = useState<DocumentType | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<DocumentItem | null>(null);
  const [preview, setPreview] = useState<PreviewState | null>(null);
  const [previewLoadingId, setPreviewLoadingId] = useState<number | null>(null);

  const fallback = "—";

  const closePreview = useCallback(() => {
    setPreview((current) => {
      if (current?.url) URL.revokeObjectURL(current.url);
      return null;
    });
  }, []);

  const loadDocuments = useCallback(async () => {
    if (!Number.isFinite(userId)) {
      setDocuments([]);
      setDocumentsError(true);
      setDocumentsLoading(false);
      return;
    }

    try {
      setDocumentsLoading(true);
      setDocumentsError(false);

      const docsData = await getUserDocuments(userId);
      setDocuments(Array.isArray(docsData) ? docsData : []);
    } catch {
      setDocuments([]);
      setDocumentsError(true);
    } finally {
      setDocumentsLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    void loadDocuments();
  }, [loadDocuments]);

  useEffect(() => {
    return () => {
      if (preview?.url) URL.revokeObjectURL(preview.url);
    };
  }, [preview?.url]);

  function getDocs(type: DocumentType): DocumentItem[] {
    return documents.filter((document) => document.type === type);
  }

  function getPrimaryDoc(type: DocumentType): DocumentItem | null {
    return getDocs(type)[0] ?? null;
  }

  function getLabel(type: DocumentType): string {
    if (type === DOCUMENT_TYPE.CONTRACT) return t("documents", "contract");
    if (type === DOCUMENT_TYPE.PAYSLIP) return t("documents", "payslip");

    return type;
  }

  function getUploadLabel(type: DocumentType, hasDocument: boolean): string {
    if (type === DOCUMENT_TYPE.CONTRACT) {
      return hasDocument
        ? t("documents", "replaceContract")
        : t("documents", "uploadContract");
    }

    return hasDocument
      ? t("documents", "replacePayslip")
      : t("documents", "uploadPayslip");
  }

  async function handlePreview(document: DocumentItem) {
    try {
      setPreviewLoadingId(document.id);

      const blob = await adminDownloadDocumentFile(document.id);
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

  async function handleUpload(type: DocumentType, file: File | null) {
    if (!file) return;

    try {
      setSavingType(type);

      const form = new FormData();
      form.append("type", type);
      form.append("category", DOCUMENT_CATEGORY.COMPANY);
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

  function renderDocumentList(type: DocumentType) {
    const docs =
      type === DOCUMENT_TYPE.CONTRACT
        ? getDocs(type).slice(0, 1)
        : getDocs(type);

    if (docs.length === 0) {
      return (
        <p className="mt-2 text-sm text-slate-400">
          {t("documents", "noFile")}
        </p>
      );
    }

    return (
      <div className="mt-3 space-y-2">
        {docs.map((document) => {
          const isDeleting = deletingId === document.id;
          const isPreviewLoading = previewLoadingId === document.id;
          const date = document.updated_at || document.created_at;

          return (
            <ListRow
              key={document.id}
              leading={<FileText className="h-4 w-4" />}
              title={
                isPreviewLoading
                  ? t("documents", "opening")
                  : document.file_name || fallback
              }
              meta={
                <ListChip icon={<CalendarDays className="h-3 w-3" />}>
                  {formatDate(date, localeTag)}
                </ListChip>
              }
              actions={
                <div className="flex flex-wrap justify-end gap-2">
                  <Button
                    size="sm"
                    variant="secondary"
                    disabled={isPreviewLoading}
                    loading={isPreviewLoading}
                    onClick={() => void handlePreview(document)}
                  >
                    {t("documents", "viewDocument")}
                  </Button>

                  <Button
                    size="sm"
                    variant="danger"
                    disabled={isDeleting}
                    loading={isDeleting}
                    onClick={() => setConfirmDelete(document)}
                  >
                    <Trash2 className="h-4 w-4" />
                    {t("common", "delete")}
                  </Button>
                </div>
              }
            />
          );
        })}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Button
        variant="back"
        onClick={() => router.push("/admin/documents/company-documents")}
      >
        <ArrowLeft className="h-4 w-4" />
        {t("common", "back")}
      </Button>

      <DataStateBoundary
        isLoading={usersLoading || documentsLoading}
        isError={Boolean(usersError || documentsError)}
        errorMessage={
          usersError ||
          (documentsError ? t("documents", "failedToLoadData") : "")
        }
      >
        <SectionCard title={t("documents", "user")}>
          {user ? (
            <ListRow
              leading={<User className="h-4 w-4" />}
              title={user.full_name || fallback}
              meta={
                <ListChip icon={<User className="h-3 w-3" />}>
                  {t("common", "shift")}: {user.shift_number || fallback}
                </ListChip>
              }
            />
          ) : (
            <p className="text-sm text-slate-400">
              {t("documents", "userNotFound")}
            </p>
          )}
        </SectionCard>

        <SectionCard title={t("documents", "documents")}>
          <div className="space-y-3">
            {DOCUMENT_TYPES.map((type) => {
              const document = getPrimaryDoc(type);
              const isSaving = savingType === type;

              return (
                <SectionCard
                  key={type}
                  title={getLabel(type)}
                  icon={<FileText className="h-5 w-5" />}
                  actions={
                    <>
                      <input
                        type="file"
                        ref={(element) => {
                          fileInputsRef.current[type] = element;
                        }}
                        onChange={(event) =>
                          void handleUpload(
                            type,
                            event.target.files?.[0] ?? null
                          )
                        }
                        disabled={isSaving}
                        className="hidden"
                      />

                      <Button
                        size="sm"
                        disabled={isSaving}
                        loading={isSaving}
                        onClick={() => fileInputsRef.current[type]?.click()}
                      >
                        <Upload className="h-4 w-4" />
                        {getUploadLabel(type, Boolean(document))}
                      </Button>
                    </>
                  }
                >
                  {renderDocumentList(type)}
                </SectionCard>
              );
            })}
          </div>
        </SectionCard>
      </DataStateBoundary>

      <AppModal
        open={Boolean(preview)}
        onClose={closePreview}
        title={preview?.fileName}
      >
        {preview ? (
          <iframe
            src={preview.url}
            title={preview.fileName}
            className="h-[70vh] w-full rounded-xl bg-black"
          />
        ) : null}
      </AppModal>

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
        onCancel={() => {
          if (deletingId !== null) return;
          setConfirmDelete(null);
        }}
      />
    </div>
  );
}