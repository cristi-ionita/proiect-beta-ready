"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, CalendarDays, Download, FileText } from "lucide-react";

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
import { myDownloadDocumentFile } from "@/services/documents.api";

export default function ContractDocumentScreen() {
  const router = useRouter();
  const { t, localeTag } = useSafeI18n();
  const { data, loading, error } = useMyDocuments();

  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewName, setPreviewName] = useState("");
  const [downloadingId, setDownloadingId] = useState<number | null>(null);

  const documents = Array.isArray(data) ? data : [];

  const contracts = documents.filter(
    (document) => document.type === "contract"
  );
  const payslips = documents.filter((document) => document.type === "payslip");

  async function handlePreview(id: number, fileName?: string | null) {
    const blob = await myDownloadDocumentFile(id);
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

  async function handleDownload(id: number, fileName?: string | null) {
    try {
      setDownloadingId(id);

      const blob = await myDownloadDocumentFile(id);
      const url = URL.createObjectURL(blob);

      const link = document.createElement("a");
      link.href = url;
      link.download = fileName || "document";
      document.body.appendChild(link);
      link.click();
      link.remove();

      URL.revokeObjectURL(url);
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
            <ListRow
              key={document.id}
              leading={<FileText className="h-4 w-4" />}
              title={document.file_name || "document"}
              meta={
                <ListChip icon={<CalendarDays className="h-3 w-3" />}>
                  {formatDate(document.created_at, localeTag)}
                </ListChip>
              }
              actions={
                <div className="flex flex-wrap justify-end gap-2">
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() =>
                      void handlePreview(document.id, document.file_name)
                    }
                  >
                    {t("documents", "viewDocument")}
                  </Button>

                  <Button
                    size="sm"
                    disabled={isDownloading}
                    loading={isDownloading}
                    onClick={() =>
                      void handleDownload(document.id, document.file_name)
                    }
                  >
                    <Download className="h-4 w-4" />
                    {t("documents", "download")}
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