"use client";

import { useRouter, useSearchParams } from "next/navigation";
import {
  ArrowLeft,
  Check,
  MailCheck,
  MailX,
  UserRound,
  Users,
  X,
} from "lucide-react";

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
          <ArrowLeft className="h-4 w-4" />
          {t("common", "back")}
        </Button>
      ) : null}

      <SectionCard
        title={t("pendingUsers", "title")}
        actions={
          <ListChip icon={<Users className="h-3.5 w-3.5" />} variant="blue">
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
                  leading={<UserRound className="h-4 w-4" />}
                  title={request.full_name}
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
                  subtitle={`${request.email || t("pendingUsers", "noEmail")} • ${
                    request.role
                  }`}
                  meta={
                    <>
                      {request.username ? (
                        <ListChip icon={<UserRound className="h-3 w-3" />}>
                          {t("pendingUsers", "username")}: {request.username}
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
                            <MailCheck className="h-3 w-3" />
                          ) : (
                            <MailX className="h-3 w-3" />
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
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        size="sm"
                        onClick={() => void approveAction(request.id)}
                        disabled={isWorking || !isEmailVerified}
                        aria-label={`${t("pendingUsers", "approve")} ${
                          request.full_name
                        }`}
                      >
                        <Check className="h-4 w-4" />
                      </Button>

                      <Button
                        type="button"
                        size="sm"
                        variant="danger"
                        onClick={() => void rejectAction(request.id)}
                        disabled={isWorking}
                        aria-label={`${t("pendingUsers", "reject")} ${
                          request.full_name
                        }`}
                      >
                        <X className="h-4 w-4" />
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