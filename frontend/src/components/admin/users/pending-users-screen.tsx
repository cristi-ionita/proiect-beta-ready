"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Check, MailCheck, MailX, UserRound, Users, X } from "lucide-react";

import DataStateBoundary from "@/components/patterns/data-state-boundary";
import ListChip from "@/components/patterns/list-chip";
import ListRow from "@/components/patterns/list-row";
import Button from "@/components/ui/button";
import SectionCard from "@/components/ui/section-card";
import StatusBadge from "@/components/ui/status-badge";
import { useSafeI18n } from "@/hooks/use-safe-i18n";
import { usePendingUsers } from "@/hooks/users/use-pending-users";

export default function PendingUsersScreen() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { t } = useSafeI18n();

  const showBackButton = searchParams.get("from") === "dashboard";

  const {
    users: requests,
    loading,
    workingId,
    error,
    approveAction,
    rejectAction,
  } = usePendingUsers();

  return (
    <div className="space-y-6">
      {showBackButton ? (
        <Button variant="back" onClick={() => router.push("/admin/dashboard")}>
          {t("common", "back")}
        </Button>
      ) : null}

      <SectionCard
        title={t("pendingUsers", "title")}
        actions={
          <ListChip icon={<Users className="h-3.5 w-3.5 shrink-0" />} variant="blue">
            {requests.length}
          </ListChip>
        }
      >
        <DataStateBoundary
          isLoading={loading}
          isError={Boolean(error)}
          errorMessage={error ?? t("pendingUsers", "failedToLoad")}
          isEmpty={requests.length === 0}
          emptyTitle={t("pendingUsers", "empty")}
        >
          <div className="space-y-3">
            {requests.map((request) => {
              const isWorking = workingId === request.id;
              const emailVerifiedAt = (
                request as { email_verified_at?: string | null }
              ).email_verified_at;
              const isEmailVerified = Boolean(emailVerifiedAt);

              return (
                <ListRow
                  key={request.id}
                  leading={<UserRound className="h-4 w-4 shrink-0" />}
                  title={request.full_name}
                  subtitle={
                    <span className="block min-w-0 break-words">
                      {request.email || t("pendingUsers", "noEmail")}
                      <span className="mx-1 text-slate-600">•</span>
                      {request.role}
                    </span>
                  }
                  badge={
                    <StatusBadge
                      label={
                        isEmailVerified
                          ? t("pendingUsers", "emailVerified")
                          : t("pendingUsers", "emailNotVerified")
                      }
                      variant={isEmailVerified ? "success" : "warning"}
                      size="sm"
                    />
                  }
                  meta={
                    <>
                      {request.username ? (
                        <ListChip icon={<UserRound className="h-3 w-3 shrink-0" />}>
                          <span className="break-words">
                            {t("pendingUsers", "username")}: {request.username}
                          </span>
                        </ListChip>
                      ) : null}

                      {request.shift_number ? (
                        <ListChip>
                          {t("common", "shift")}: {request.shift_number}
                        </ListChip>
                      ) : null}

                      <ListChip
                        icon={
                          isEmailVerified ? (
                            <MailCheck className="h-3 w-3 shrink-0" />
                          ) : (
                            <MailX className="h-3 w-3 shrink-0" />
                          )
                        }
                        variant={isEmailVerified ? "emerald" : "amber"}
                      >
                        {isEmailVerified
                          ? t("pendingUsers", "canApprove")
                          : t("pendingUsers", "cannotApprove")}
                      </ListChip>
                    </>
                  }
                  actions={
                    <div className="grid w-full grid-cols-2 gap-2 sm:flex sm:w-auto">
                      <Button
                        type="button"
                        size="sm"
                        className="w-full sm:w-auto"
                        onClick={() => void approveAction(request.id)}
                        disabled={isWorking || !isEmailVerified}
                        aria-label={`${t("pendingUsers", "approve")} ${
                          request.full_name
                        }`}
                      >
                        <Check className="h-4 w-4 shrink-0" />
                        <span>{t("pendingUsers", "approve")}</span>
                      </Button>

                      <Button
                        type="button"
                        size="sm"
                        variant="danger"
                        className="w-full sm:w-auto"
                        onClick={() => void rejectAction(request.id)}
                        disabled={isWorking}
                        aria-label={`${t("pendingUsers", "reject")} ${
                          request.full_name
                        }`}
                      >
                        <X className="h-4 w-4 shrink-0" />
                        <span>{t("pendingUsers", "reject")}</span>
                      </Button>
                    </div>
                  }
                />
              );
            })}
          </div>
        </DataStateBoundary>
      </SectionCard>
    </div>
  );
}