"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { CalendarDays, FileText, Plus, User } from "lucide-react";

import DataStateBoundary from "@/components/patterns/data-state-boundary";
import ListChip from "@/components/patterns/list-chip";
import ListRow from "@/components/patterns/list-row";
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
  type: string;
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

  const [selectedDocument, setSelectedDocument] = useState<DocumentItem | null>(
    null
  );
  const [preview, setPreview] = useState<PreviewState | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);

  const fallback = "—";

  const isWorking = Boolean(
    selectedDocument &&
      (deletingId === selectedDocument.id ||
        savingType === selectedDocument.type)
  );

  const closePreview = useCallback(() => {
    setPreview((current) => {
      if (current?.url) URL.revokeObjectURL(current.url);
      return null;
    });

    setSelectedDocument(null);
    setPreviewLoading(false);
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

  async function openDocumentDialog(document: DocumentItem) {
    try {
      setSelectedDocument(document);
      setPreviewLoading(true);
      setDocumentsError(false);

      const blob = await adminDownloadDocumentFile(document.id);
      const url = URL.createObjectURL(blob);

      setPreview((current) => {
        if (current?.url) URL.revokeObjectURL(current.url);

        return {
          url,
          type: blob.type,
        };
      });
    } catch {
      setDocumentsError(true);
    } finally {
      setPreviewLoading(false);
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
      closePreview();
    } finally {
      setSavingType(null);

      const input = fileInputsRef.current[type];
      if (input) input.value = "";
    }
  }

  async function handleDeleteSelected() {
    if (!selectedDocument) return;

    try {
      setDeletingId(selectedDocument.id);

      await adminDeleteDocument(selectedDocument.id);
      await loadDocuments();
      closePreview();
    } finally {
      setDeletingId(null);
    }
  }

  function handleReplaceSelected() {
    if (!selectedDocument) return;
    fileInputsRef.current[selectedDocument.type]?.click();
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
          const date = document.updated_at || document.created_at;

          return (
            <ListRow
              key={document.id}
              leading={<FileText className="h-4 w-4 shrink-0" />}
              title={document.file_name || fallback}
              meta={
                <ListChip icon={<CalendarDays className="h-3 w-3 shrink-0" />}>
                  {formatDate(date, localeTag)}
                </ListChip>
              }
              onClick={() => void openDocumentDialog(document)}
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
              leading={<User className="h-4 w-4 shrink-0" />}
              title={user.full_name || fallback}
              meta={
                <ListChip icon={<User className="h-3 w-3 shrink-0" />}>
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
                        className="flex h-9 w-9 items-center justify-center p-0"
                        disabled={isSaving}
                        loading={isSaving}
                        onClick={() => fileInputsRef.current[type]?.click()}
                        aria-label={`Adaugă ${getLabel(type)}`}
                      >
                        <Plus className="h-4 w-4" />
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

      <ConfirmDialog
        open={Boolean(selectedDocument)}
        title={selectedDocument?.file_name || ""}
        message=""
        confirmText="Înlocuiește"
        cancelText="Închide"
        confirmVariant="primary"
        loading={isWorking}
        onConfirm={handleReplaceSelected}
        onCancel={closePreview}
      >
        <div className="space-y-4">
          {previewLoading ? (
            <p className="text-sm text-slate-300">Se încarcă...</p>
          ) : preview ? (
            preview.type.includes("image") ? (
              <img
                src={preview.url}
                alt={selectedDocument?.file_name || "document"}
                className="max-h-[60vh] w-full rounded-2xl object-contain"
              />
            ) : (
              <iframe
                src={preview.url}
                title={selectedDocument?.file_name || "document"}
                className="h-[60vh] w-full rounded-2xl bg-white"
              />
            )
          ) : null}

          <Button
            type="button"
            variant="danger"
            className="w-full"
            disabled={isWorking || previewLoading}
            onClick={() => void handleDeleteSelected()}
          >
            Șterge
          </Button>
        </div>
      </ConfirmDialog>
    </div>
  );
}