"use client";

import { Download, Eye, type LucideIcon } from "lucide-react";

import CardShell from "@/components/patterns/card-shell";
import Button from "@/components/ui/button";
import Card from "@/components/ui/card";

type DocumentPreviewCardProps = {
  icon: LucideIcon;
  accent: "violet" | "amber" | "blue" | "rose" | "emerald";
  fileName: string;
  status: string;
  category: string;
  createdAtLabel: string;
  createdAtValue: string;
  onView: () => void;
  onDownload: () => void;
  viewLabel?: string;
  downloadLabel?: string;
};

export default function DocumentPreviewCard({
  icon: Icon,
  accent,
  fileName,
  status,
  category,
  createdAtLabel,
  createdAtValue,
  onView,
  onDownload,
  viewLabel = "View",
  downloadLabel = "Download",
}: DocumentPreviewCardProps) {
  return (
    <CardShell accent={accent}>
      <Card className="p-5">
        <div className="flex h-14 w-14 items-center justify-center rounded-[18px] bg-black text-white">
          <Icon className="h-6 w-6" />
        </div>

        <div className="mt-5 grid gap-4 md:grid-cols-2">
          <InfoTile label="File" value={fileName} />
          <InfoTile label="Status" value={status} />
          <InfoTile label="Category" value={category} />
          <InfoTile label={createdAtLabel} value={createdAtValue} />
        </div>

        <div className="mt-6 flex flex-wrap gap-3">
          <Button
            variant="secondary"
            onClick={onView}
            className="rounded-xl"
          >
            <Eye className="h-4 w-4" />
            {viewLabel}
          </Button>

          <Button onClick={onDownload} className="rounded-xl">
            <Download className="h-4 w-4" />
            {downloadLabel}
          </Button>
        </div>
      </Card>
    </CardShell>
  );
}

function InfoTile({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-[18px] border border-white/10 bg-white/10 p-4">
      <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-300">
        {label}
      </p>
      <p className="mt-2 break-words text-sm font-medium text-white">{value}</p>
    </div>
  );
}