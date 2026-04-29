"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Download,
  FileText,
  Mail,
  Shield,
  User,
} from "lucide-react";

import DataStateBoundary from "@/components/patterns/data-state-boundary";
import ListChip from "@/components/patterns/list-chip";
import ListRow from "@/components/patterns/list-row";
import AppModal from "@/components/ui/app-modal";
import Button from "@/components/ui/button";
import SectionCard from "@/components/ui/section-card";
import { useSafeI18n } from "@/hooks/use-safe-i18n";
import { useActiveUsersTableData } from "@/hooks/users/use-active-users-table-data";
import { useAdminUsersData } from "@/hooks/users/use-admin-users-data";
import {
  adminDownloadDocumentFile,
  getUserDocuments,
} from "@/services/documents.api";
import {
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
  fileName: string;
};

const USER_DOCUMENT_TYPES = [
  DOCUMENT_TYPE.ID_CARD,
  DOCUMENT_TYPE.DRIVER_LICENSE,
] as const;

export default function AdminDocumentsDetailsScreen({ userId }: Props) {
  const router = useRouter();
  const { t } = useSafeI18n();

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

  const rawUser = useMemo(
    () => data.users.find((item) => Number(item.id) === Number(userId)) ?? null,
    [data.users, userId]
  );

  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [documentsLoading, setDocumentsLoading] = useState(true);
  const [documentsError, setDocumentsError] = useState(false);
  const [preview, setPreview] = useState<PreviewState | null>(null);
  const [previewLoadingId, setPreviewLoadingId] = useState<number | null>(null);
  const [downloadingId, setDownloadingId] = useState<number | null>(null);

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

      const documentsData = await getUserDocuments(userId);
      setDocuments(Array.isArray(documentsData) ? documentsData : []);
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

  function getDocument(type: DocumentType): DocumentItem | null {
    return documents.find((document) => document.type === type) ?? null;
  }

  function getDocumentLabel(type: DocumentType): string {
    if (type === DOCUMENT_TYPE.ID_CARD) return t("documents", "idCard");

    if (type === DOCUMENT_TYPE.DRIVER_LICENSE) {
      return t("documents", "driverLicense");
    }

    return type;
  }

  async function openPreview(document: DocumentItem) {
    try {
      setPreviewLoadingId(document.id);
      setDocumentsError(false);

      const blob = await adminDownloadDocumentFile(document.id);
      const url = URL.createObjectURL(blob);

      setPreview((current) => {
        if (current?.url) URL.revokeObjectURL(current.url);

        return {
          url,
          type: blob.type,
          fileName: document.file_name || "document",
        };
      });
    } catch {
      setDocumentsError(true);
    } finally {
      setPreviewLoadingId(null);
    }
  }

  async function handleDownload(document: DocumentItem) {
    try {
      setDownloadingId(document.id);
      setDocumentsError(false);

      const blob = await adminDownloadDocumentFile(document.id);
      const url = URL.createObjectURL(blob);

      const anchor = window.document.createElement("a");
      anchor.href = url;
      anchor.download = document.file_name || "document";
      window.document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();

      URL.revokeObjectURL(url);
    } catch {
      setDocumentsError(true);
    } finally {
      setDownloadingId(null);
    }
  }

  return (
    <div className="space-y-6">
      <Button
        variant="back"
        onClick={() => router.push("/admin/documents/user-documents")}
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
                <>
                  <ListChip icon={<Mail className="h-3 w-3" />}>
                    {rawUser?.email || fallback}
                  </ListChip>

                  <ListChip icon={<Shield className="h-3 w-3" />}>
                    {t("common", "shift")}: {user.shift_number || fallback}
                  </ListChip>
                </>
              }
            />
          ) : (
            <p className="text-sm text-slate-400">
              {t("documents", "userNotFound")}
            </p>
          )}
        </SectionCard>

        <SectionCard title={t("documents", "documents")}>
          <DataStateBoundary
            isEmpty={documents.length === 0}
            emptyTitle={t("documents", "noFile")}
          >
            <div className="space-y-3">
              {USER_DOCUMENT_TYPES.map((type) => {
                const document = getDocument(type);
                const isPreviewLoading =
                  document !== null && previewLoadingId === document.id;
                const isDownloading =
                  document !== null && downloadingId === document.id;

                return (
                  <SectionCard
                    key={type}
                    title={getDocumentLabel(type)}
                    icon={<FileText className="h-5 w-5" />}
                  >
                    {document ? (
                      <ListRow
                        leading={<FileText className="h-4 w-4" />}
                        title={
                          isPreviewLoading
                            ? t("documents", "opening")
                            : document.file_name || fallback
                        }
                        actions={
                          <div className="flex flex-wrap justify-end gap-2">
                            <Button
                              size="sm"
                              variant="secondary"
                              loading={isPreviewLoading}
                              disabled={isPreviewLoading}
                              onClick={() => void openPreview(document)}
                            >
                              {t("documents", "viewDocument")}
                            </Button>

                            <Button
                              size="sm"
                              loading={isDownloading}
                              disabled={isDownloading}
                              onClick={() => void handleDownload(document)}
                            >
                              <Download className="h-4 w-4" />
                              {t("documents", "download")}
                            </Button>
                          </div>
                        }
                      />
                    ) : (
                      <p className="text-sm text-slate-400">
                        {t("documents", "noFile")}
                      </p>
                    )}
                  </SectionCard>
                );
              })}
            </div>
          </DataStateBoundary>
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
              alt={t("documents", "documentPreview")}
              className="max-h-[70vh] w-full rounded-xl object-contain"
            />
          ) : (
            <iframe
              src={preview.url}
              title={t("documents", "documentPreview")}
              className="h-[70vh] w-full rounded-xl bg-white"
            />
          )
        ) : null}
      </AppModal>
    </div>
  );
}