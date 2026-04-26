"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Download,
  FileText,
  Mail,
  Shield,
  User,
  X,
} from "lucide-react";

import DataStateBoundary from "@/components/patterns/data-state-boundary";
import SectionCard from "@/components/ui/section-card";
import Button from "@/components/ui/button";

import { useSafeI18n } from "@/hooks/use-safe-i18n";
import { useAdminUsersData } from "@/hooks/admin/use-admin-users-data";
import { useActiveUsersTableData } from "@/hooks/users/use-active-users-table-data";
import { isApiClientError } from "@/lib/api-error";
import {
  getUserDocuments,
  adminDownloadDocumentFile,
} from "@/services/documents.api";

import type { DocumentItem } from "@/types/document.types";

type Props = {
  userId: number;
};

const USER_DOCUMENT_TYPES = ["ID_CARD", "DRIVER_LICENSE"] as const;

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
    () => usersData.find((item) => Number(item.id) === Number(userId)) || null,
    [usersData, userId]
  );

  const rawUser = useMemo(
    () => data.users.find((item) => Number(item.id) === Number(userId)) || null,
    [data.users, userId]
  );

  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [documentsLoading, setDocumentsLoading] = useState(true);
  const [error, setError] = useState("");
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewType, setPreviewType] = useState<string>("");

  function handleError(err: unknown) {
    setError(
      isApiClientError(err) ? err.message : t("documents", "failedToLoadData")
    );
  }

  useEffect(() => {
    async function loadDocuments() {
      try {
        setDocumentsLoading(true);
        setError("");

        const documentsData = await getUserDocuments(userId);
        setDocuments(Array.isArray(documentsData) ? documentsData : []);
      } catch (err) {
        setDocuments([]);
        handleError(err);
      } finally {
        setDocumentsLoading(false);
      }
    }

    if (userId) void loadDocuments();
  }, [userId]);

  function getDocument(type: string) {
    return (
      documents.find(
        (document) =>
          String(document.type || "").toLowerCase() === type.toLowerCase()
      ) || null
    );
  }

  function getDocumentLabel(type: string) {
    return type === "ID_CARD"
      ? t("documents", "idCard")
      : t("documents", "driverLicense");
  }

  async function openPreview(document: DocumentItem) {
    try {
      setError("");

      if (previewUrl) URL.revokeObjectURL(previewUrl);

      const blob = await adminDownloadDocumentFile(document.id);
      const url = URL.createObjectURL(blob);

      setPreviewUrl(url);
      setPreviewType(blob.type);
    } catch (err) {
      handleError(err);
    }
  }

  function closePreview() {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
    setPreviewType("");
  }

  async function handleDownload(document: DocumentItem) {
    try {
      setError("");

      const blob = await adminDownloadDocumentFile(document.id);
      const url = URL.createObjectURL(blob);

      const anchor = window.document.createElement("a");
      anchor.href = url;
      anchor.download = document.file_name || "document";
      window.document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();

      URL.revokeObjectURL(url);
    } catch (err) {
      handleError(err);
    }
  }

  return (
    <DataStateBoundary
      isLoading={usersLoading || documentsLoading}
      isError={Boolean(error || usersError)}
      errorMessage={error || usersError || t("documents", "failedToLoadData")}
    >
      <div className="space-y-6">
        <Button
          variant="ghost"
          onClick={() => router.push("/admin/documents/user-documents")}
          className="rounded-full border border-white/10 bg-white/10 px-4 py-2 text-white backdrop-blur-md hover:bg-white/15"
        >
          <ArrowLeft className="h-4 w-4" />
          {t("common", "back")}
        </Button>

        <SectionCard title={t("documents", "user")}>
          {user ? (
            <div className="grid gap-4 md:grid-cols-3">
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <div className="mb-2 flex items-center gap-2 text-slate-300">
                  <User className="h-4 w-4" />
                  <span className="text-xs font-semibold uppercase tracking-[0.14em]">
                    {t("documents", "name")}
                  </span>
                </div>
                <p className="font-semibold text-white">{user.full_name || "-"}</p>
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <div className="mb-2 flex items-center gap-2 text-slate-300">
                  <Mail className="h-4 w-4" />
                  <span className="text-xs font-semibold uppercase tracking-[0.14em]">
                    {t("documents", "email")}
                  </span>
                </div>
                <p className="font-semibold text-white">{rawUser?.email || "-"}</p>
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <div className="mb-2 flex items-center gap-2 text-slate-300">
                  <Shield className="h-4 w-4" />
                  <span className="text-xs font-semibold uppercase tracking-[0.14em]">
                    {t("common", "shift")}
                  </span>
                </div>
                <p className="font-semibold text-white">{user.shift_number || "-"}</p>
              </div>
            </div>
          ) : (
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-slate-300">
              {t("documents", "userNotFound")}
            </div>
          )}
        </SectionCard>

        <SectionCard title={t("documents", "documents")}>
          <DataStateBoundary
            isEmpty={documents.length === 0}
            emptyTitle={t("documents", "noFile")}
          >
            <div className="grid gap-4 md:grid-cols-2">
              {USER_DOCUMENT_TYPES.map((type) => {
                const document = getDocument(type);

                return (
                  <div
                    key={type}
                    className="space-y-3 rounded-2xl border border-white/10 bg-white/5 p-4"
                  >
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4 text-white" />
                      <span className="font-semibold text-white">
                        {getDocumentLabel(type)}
                      </span>
                    </div>

                    {document ? (
                      <>
                        <button
                          type="button"
                          onClick={() => void openPreview(document)}
                          className="block max-w-full truncate text-left text-sm text-blue-300 underline-offset-4 hover:text-blue-200 hover:underline"
                        >
                          {document.file_name}
                        </button>

                        <Button
                          size="sm"
                          onClick={() => void handleDownload(document)}
                          className="rounded-full"
                        >
                          <Download className="h-4 w-4" />
                          {t("documents", "download")}
                        </Button>
                      </>
                    ) : (
                      <p className="text-sm text-slate-400">
                        {t("documents", "noFile")}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          </DataStateBoundary>
        </SectionCard>
      </div>

      {previewUrl ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
          <button
            type="button"
            onClick={closePreview}
            className="absolute right-4 top-4 rounded-full bg-black/60 p-2 text-white hover:bg-black/80"
          >
            <X className="h-5 w-5" />
          </button>

          {previewType.includes("image") ? (
            <img
              src={previewUrl}
              alt="Document preview"
              className="max-h-[90vh] max-w-[90vw] rounded-xl"
            />
          ) : (
            <iframe
              src={previewUrl}
              className="h-[90vh] w-[90vw] rounded-xl bg-white"
            />
          )}
        </div>
      ) : null}
    </DataStateBoundary>
  );
}