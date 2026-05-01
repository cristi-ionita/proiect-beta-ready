"use client";

import { useParams, useRouter } from "next/navigation";

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

  const { issue, loading, error } = useAdminIssueDetails({
    issueId,
    errorMessage: t("issues", "failedToLoadDetails"),
  });

  if (!loading && !error && !issue) {
    return (
      <div className="space-y-6">
        <Button variant="back" onClick={() => router.back()}>
          {t("common", "back")}
        </Button>

        <EmptyState title={t("issues", "notFound")} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Button variant="back" onClick={() => router.back()}>
        {t("common", "back")}
      </Button>

      <DataStateBoundary
        isLoading={loading}
        isError={Boolean(error && !issue)}
        errorMessage={error ?? t("common", "genericError")}
      >
        {issue ? <IssueDetailsCard issue={issue} locale={locale} /> : null}
      </DataStateBoundary>
    </div>
  );
}