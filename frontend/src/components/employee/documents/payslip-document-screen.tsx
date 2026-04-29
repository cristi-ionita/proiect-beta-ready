"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  CalendarDays,
  Download,
  FileText,
  Folder,
} from "lucide-react";

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

export default function PayslipDocumentScreen() {
  const router = useRouter();
  const { t, localeTag } = useSafeI18n();
  const { data, loading, error } = useMyDocuments();

  const [downloadingId, setDownloadingId] = useState<number | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewName, setPreviewName] = useState("");

  const documents = Array.isArray(data) ? data : [];
  const payslips = documents.filter((document) => document.type === "payslip");

  function getCategoryLabel(category?: string | null) {
    if (category === "company") return t("documents", "company");
    return category || "—";
  }

  async function handlePreview(id: number, fileName?: string | null) {
    const blob = await myDownloadDocumentFile(id);
    const url = window.URL.createObjectURL(blob);

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
      const url = window.URL.createObjectURL(blob);

      const link = document.createElement("a");
      link.href = url;
      link.download = fileName || "document";
      document.body.appendChild(link);
      link.click();
      link.remove();

      window.URL.revokeObjectURL(url);
    } finally {
      setDownloadingId(null);
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

      <SectionCard title={t("documents", "payslip")}>
        <DataStateBoundary
          isLoading={loading}
          isError={Boolean(error)}
          errorMessage={error ?? t("documents", "failedToLoadDocuments")}
          isEmpty={payslips.length === 0}
          emptyTitle={t("documents", "noDocuments")}
          emptyDescription={t("documents", "noDocumentsDescription")}
        >
          <div className="space-y-2.5">
            {payslips.map((document) => {
              const isDownloading = downloadingId === document.id;

              return (
                <ListRow
                  key={document.id}
                  leading={<FileText className="h-4 w-4" />}
                  title={document.file_name || "document"}
                  meta={
                    <>
                      <ListChip icon={<FileText className="h-3 w-3" />}>
                        {t("documents", "payslip")}
                      </ListChip>

                      <ListChip icon={<Folder className="h-3 w-3" />}>
                        {getCategoryLabel(document.category)}
                      </ListChip>

                      <ListChip icon={<CalendarDays className="h-3 w-3" />}>
                        {formatDate(document.created_at, localeTag)}
                      </ListChip>
                    </>
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
        </DataStateBoundary>
      </SectionCard>

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