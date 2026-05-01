"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Download, FileText } from "lucide-react";

import DataStateBoundary from "@/components/patterns/data-state-boundary";
import AppModal from "@/components/ui/app-modal";
import Button from "@/components/ui/button";
import SectionCard from "@/components/ui/section-card";
import { ROUTES } from "@/constants/routes";
import { useMyDocuments } from "@/hooks/documents/use-my-documents";
import { useSafeI18n } from "@/hooks/use-safe-i18n";
import { myDownloadDocumentFile } from "@/services/documents.api";

export default function ContractDocumentScreen() {
  const router = useRouter();
  const { t } = useSafeI18n();
  const { data, loading, error } = useMyDocuments();

  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewType, setPreviewType] = useState("");
  const [previewName, setPreviewName] = useState("");
  const [downloadingId, setDownloadingId] = useState<number | null>(null);

  const documents = Array.isArray(data) ? data : [];
  const contracts = documents.filter((document) => document.type === "contract");
  const payslips = documents.filter((document) => document.type === "payslip");

  async function handlePreview(id: number, fileName?: string | null) {
    const blob = await myDownloadDocumentFile(id);
    const url = URL.createObjectURL(blob);

    setPreviewUrl((current) => {
      if (current) URL.revokeObjectURL(current);
      return url;
    });

    setPreviewType(blob.type);
    setPreviewName(fileName || "document");
  }

  function closePreview() {
    setPreviewUrl((current) => {
      if (current) URL.revokeObjectURL(current);
      return null;
    });

    setPreviewType("");
    setPreviewName("");
  }

  async function handleDownload(id: number, fileName?: string | null) {
    try {
      setDownloadingId(id);

      const blob = await myDownloadDocumentFile(id);
      const url = URL.createObjectURL(blob);

      const link = window.document.createElement("a");
      link.href = url;
      link.download = fileName || "document";
      link.target = "_self";
      link.rel = "noopener";
      link.style.display = "none";

      window.document.body.appendChild(link);
      link.click();
      link.remove();

      window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    } finally {
      setDownloadingId(null);
    }
  }

  function renderDocumentList(items: typeof documents, emptyText: string) {
    if (items.length === 0) {
      return <p className="text-sm text-slate-400">{emptyText}</p>;
    }

    return (
      <div className="space-y-2.5">
        {items.map((document) => {
          const isDownloading = downloadingId === document.id;

          return (
            <div
              key={document.id}
              className="flex items-center gap-3 rounded-3xl border border-white/10 bg-white/10 p-4"
            >
              <button
                type="button"
                onClick={() => void handlePreview(document.id, document.file_name)}
                className="flex min-w-0 flex-1 items-center gap-3 text-left"
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-black/60 text-white">
                  <FileText className="h-4 w-4" />
                </div>

                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-bold text-white">
                    {document.file_name || "document"}
                  </p>
                </div>
              </button>

              <Button
                size="sm"
                className="flex h-9 w-9 shrink-0 items-center justify-center p-0"
                disabled={isDownloading}
                loading={isDownloading}
                onClick={(event) => {
                  event.stopPropagation();
                  void handleDownload(document.id, document.file_name);
                }}
                aria-label={t("documents", "download")}
              >
                <Download className="h-5 w-5 stroke-[2.75]" />
              </Button>
            </div>
          );
        })}
      </div>
    );
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
        isEmpty={contracts.length === 0 && payslips.length === 0}
        emptyTitle={t("documents", "noDocuments")}
        emptyDescription={t("documents", "noDocumentsDescription")}
      >
        <div className="space-y-4">
          <SectionCard title={t("documents", "contract")}>
            {renderDocumentList(contracts, t("documents", "noFile"))}
          </SectionCard>

          <SectionCard title={t("documents", "payslip")}>
            {renderDocumentList(payslips, t("documents", "noFile"))}
          </SectionCard>
        </div>
      </DataStateBoundary>

      <AppModal
        open={Boolean(previewUrl)}
        onClose={closePreview}
        title={previewName}
      >
        {previewUrl ? (
          previewType.includes("image") ? (
            <img
              src={previewUrl}
              alt={previewName}
              className="max-h-[70vh] w-full rounded-xl object-contain"
            />
          ) : (
            <iframe
              src={previewUrl}
              title={previewName}
              className="h-[70vh] w-full rounded-xl bg-white"
            />
          )
        ) : null}
      </AppModal>
    </div>
  );
}