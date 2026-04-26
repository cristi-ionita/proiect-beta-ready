"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, CalendarDays, Download, FileText, X } from "lucide-react";

import DataStateBoundary from "@/components/patterns/data-state-boundary";
import Button from "@/components/ui/button";
import SectionCard from "@/components/ui/section-card";
import { ROUTES } from "@/constants/routes";
import { useMyDocuments } from "@/hooks/documents/use-my-documents";
import { myDownloadDocumentFile } from "@/services/documents.api";

function formatDate(value?: string | null) {
  if (!value) return "—";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return new Intl.DateTimeFormat("ro-RO", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

export default function ContractDocumentScreen() {
  const router = useRouter();
  const { data, loading, error } = useMyDocuments();

  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [downloadingId, setDownloadingId] = useState<number | null>(null);

  const documents = Array.isArray(data) ? data : [];

  const contracts = documents.filter((doc) => doc.type === "contract");
  const payslips = documents.filter((doc) => doc.type === "payslip");

  async function handlePreview(id: number) {
    const blob = await myDownloadDocumentFile(id);
    const url = URL.createObjectURL(blob);
    setPreviewUrl(url);
  }

  function closePreview() {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
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

  function renderDocumentList(
    items: typeof documents,
    emptyText: string
  ) {
    if (items.length === 0) {
      return <p className="text-sm text-slate-400">{emptyText}</p>;
    }

    return (
      <div className="overflow-hidden rounded-[22px] border border-white/10 bg-white/10 backdrop-blur-md">
        <div className="divide-y divide-white/10">
          {items.map((doc) => {
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
                      className="block max-w-full truncate text-left text-sm font-semibold text-white hover:underline"
                    >
                      {doc.file_name}
                    </button>

                    <div className="mt-1 flex items-center gap-2 text-xs text-slate-400">
                      <CalendarDays className="h-3.5 w-3.5" />
                      {formatDate(doc.created_at)}
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
                  Descarcă
                </Button>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <DataStateBoundary
      isLoading={loading}
      isError={Boolean(error)}
      errorMessage={error ?? "Nu s-au putut încărca documentele"}
      isEmpty={contracts.length === 0 && payslips.length === 0}
      emptyTitle="Nu există documente"
      emptyDescription="Nu există contract sau payslip-uri."
    >
      <div className="space-y-4">
        <Button
          variant="ghost"
          onClick={() => router.push(ROUTES.EMPLOYEE.DOCUMENTS)}
          className="rounded-full border border-white/10 bg-white/10 px-4 py-2 text-white"
        >
          <ArrowLeft className="h-4 w-4" />
          Înapoi
        </Button>

        <SectionCard title="Contract">
          {renderDocumentList(contracts, "Nu există contract.")}
        </SectionCard>

        <SectionCard title="Payslips">
          {renderDocumentList(payslips, "Nu există payslip-uri.")}
        </SectionCard>

        {previewUrl ? (
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
                  Închide
                </Button>
              </div>

              <div className="overflow-hidden rounded-2xl border border-white/10 bg-black/30">
                <iframe src={previewUrl} className="h-[70vh] w-full" />
              </div>
            </div>
          </SectionCard>
        ) : null}
      </div>
    </DataStateBoundary>
  );
}