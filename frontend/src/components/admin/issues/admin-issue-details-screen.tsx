"use client";

import { useParams, useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import IssueDetailsCard from "@/components/admin/issues/issue-details-card";
import DataStateBoundary from "@/components/patterns/data-state-boundary";
import Button from "@/components/ui/button";
import EmptyState from "@/components/ui/empty-state";

import { useAdminIssueDetails } from "@/hooks/issues/use-admin-issue-details";
import { useSafeI18n } from "@/hooks/use-safe-i18n";

export default function AdminIssueDetailsScreen() {
  const router = useRouter();
  const params = useParams();
  const { t, locale } = useSafeI18n();

  const rawId = params?.id;
  const issueId =
    typeof rawId === "string" ? Number(rawId) : Number(rawId?.[0]);

  const loadErrorMessage = t("issues", "failedToLoadDetails");

  const { issue, loading, error } = useAdminIssueDetails({
    issueId,
    errorMessage: loadErrorMessage,
  });

  if (!loading && !error && !issue) {
    return (
      <div className="space-y-6">
        <Button
          variant="ghost"
          onClick={() => router.back()}
          className="w-fit rounded-full border border-white/10 bg-white/10 px-4 py-2 text-white shadow-[0_10px_30px_rgba(0,0,0,0.16)] hover:bg-white/15"
        >
          <ArrowLeft className="h-4 w-4" />
          {t("common", "back")}
        </Button>

        <EmptyState title={t("issues", "notFound")} />
      </div>
    );
  }

  return (
    <DataStateBoundary
      isLoading={loading}
      isError={Boolean(error && !issue)}
      errorMessage={error ?? t("common", "genericError")}
    >
      <div className="space-y-6">
        <Button
          variant="ghost"
          onClick={() => router.back()}
          className="w-fit rounded-full border border-white/10 bg-white/10 px-4 py-2 text-white shadow-[0_10px_30px_rgba(0,0,0,0.16)] hover:bg-white/15"
        >
          <ArrowLeft className="h-4 w-4" />
          {t("common", "back")}
        </Button>

        {issue ? <IssueDetailsCard issue={issue} locale={locale} /> : null}
      </div>
    </DataStateBoundary>
  );
}