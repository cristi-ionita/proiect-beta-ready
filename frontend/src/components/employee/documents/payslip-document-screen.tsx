"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  CalendarDays,
  Download,
  FileText,
  Folder,
  X,
} from "lucide-react";

import DataStateBoundary from "@/components/patterns/data-state-boundary";
import Button from "@/components/ui/button";
import SectionCard from "@/components/ui/section-card";
import { ROUTES } from "@/constants/routes";
import { useMyDocuments } from "@/hooks/documents/use-my-documents";
import { useSafeI18n } from "@/hooks/use-safe-i18n";
import { myDownloadDocumentFile } from "@/services/documents.api";

function formatDate(value?: string | null) {
  if (!value) return "—";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return new Intl.DateTimeFormat("ro-RO", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

export default function PayslipDocumentScreen() {
  const router = useRouter();
  const { t } = useSafeI18n();
  const { data, loading, error } = useMyDocuments();

  const [downloadingId, setDownloadingId] = useState<number | null>(null);
  const [preview, setPreview] = useState<{ url: string } | null>(null);

  const documents = Array.isArray(data) ? data : [];
  const payslips = documents.filter((doc) => doc.type === "payslip");

  function getCategoryLabel(category?: string | null) {
    if (category === "company") return t("documents", "company");
    return category || "—";
  }

  async function handlePreview(id: number) {
    const blob = await myDownloadDocumentFile(id);
    const url = window.URL.createObjectURL(blob);

    setPreview({ url });
  }

  function closePreview() {
    if (preview?.url) {
      URL.revokeObjectURL(preview.url);
    }

    setPreview(null);
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
    <DataStateBoundary
      isLoading={loading}
      isError={Boolean(error)}
      errorMessage={error ?? t("documents", "failedToLoadDocuments")}
      isEmpty={payslips.length === 0}
      emptyTitle={t("documents", "noDocuments")}
      emptyDescription={t("documents", "noDocumentsDescription")}
    >
      <div className="space-y-4">
        <Button
          variant="ghost"
          onClick={() => router.push(ROUTES.EMPLOYEE.DOCUMENTS)}
          className="rounded-full border border-white/10 bg-white/10 px-4 py-2 text-white"
        >
          <ArrowLeft className="h-4 w-4" />
          {t("common", "back")}
        </Button>

        <div className="overflow-hidden rounded-[26px] border border-white/10 bg-white/10 shadow backdrop-blur-md">
          <div className="divide-y divide-white/10">
            {payslips.map((doc) => {
              const isDownloading = downloadingId === doc.id;

              return (
                <div
                  key={doc.id}
                  className="flex flex-col gap-3 px-4 py-3 hover:bg-white/5 md:flex-row md:items-center md:justify-between"
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-black/30 text-white">
                      <FileText className="h-4 w-4" />
                    </div>

                    <div className="min-w-0">
                      <button
                        type="button"
                        onClick={() => void handlePreview(doc.id)}
                        className="truncate text-left text-sm font-semibold text-white hover:underline"
                      >
                        {doc.file_name}
                      </button>

                      <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-400">
                        <span className="inline-flex items-center gap-1">
                          <FileText className="h-3.5 w-3.5" />
                          {t("documents", "payslip")}
                        </span>

                        <span className="inline-flex items-center gap-1">
                          <Folder className="h-3.5 w-3.5" />
                          {getCategoryLabel(doc.category)}
                        </span>

                        <span className="inline-flex items-center gap-1">
                          <CalendarDays className="h-3.5 w-3.5" />
                          {formatDate(doc.created_at)}
                        </span>
                      </div>
                    </div>
                  </div>

                  <Button
                    size="sm"
                    disabled={isDownloading}
                    loading={isDownloading}
                    className="rounded-full"
                    onClick={() => void handleDownload(doc.id, doc.file_name)}
                  >
                    <Download className="h-4 w-4" />
                    {t("documents", "download")}
                  </Button>
                </div>
              );
            })}
          </div>
        </div>

        {preview ? (
          <SectionCard>
            <div className="space-y-3">
              <div className="flex justify-end">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={closePreview}
                  className="rounded-full border border-white/10 bg-white/10 text-white"
                >
                  <X className="h-4 w-4" />
                  {t("documents", "close")}
                </Button>
              </div>

              <div className="overflow-hidden rounded-2xl border border-white/10 bg-black/30">
                <iframe src={preview.url} className="h-[70vh] w-full" />
              </div>
            </div>
          </SectionCard>
        ) : null}
      </div>
    </DataStateBoundary>
  );
}