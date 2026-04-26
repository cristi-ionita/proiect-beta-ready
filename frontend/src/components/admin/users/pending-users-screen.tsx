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
import Button from "@/components/ui/button";
import Card from "@/components/ui/card";
import SectionCard from "@/components/ui/section-card";
import StatusBadge from "@/components/ui/status-badge";

import { usePendingUsers } from "@/hooks/users/use-pending-users";
import { useSafeI18n } from "@/hooks/use-safe-i18n";

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
    <DataStateBoundary
      isLoading={loading}
      isError={Boolean(error)}
      errorMessage={error ?? t("pendingUsers", "failedToLoad")}
    >
      <div className="space-y-6">
        {showBackButton ? (
          <div className="flex items-center justify-start">
            <Button
              variant="ghost"
              onClick={() => router.push("/admin/dashboard")}
              className="rounded-full border border-white/10 bg-white/10 px-4 py-2 text-white backdrop-blur-md hover:bg-white/15"
            >
              <ArrowLeft className="h-4 w-4" />
              {t("common", "back")}
            </Button>
          </div>
        ) : null}

        <SectionCard
          title={t("pendingUsers", "title")}
          actions={
            <div className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-700">
              <Users className="h-3.5 w-3.5" />
              {requests.length}
            </div>
          }
        >
          <DataStateBoundary
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
                  <Card key={request.id} className="p-4">
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="truncate font-semibold text-white">
                            {request.full_name}
                          </p>

                          <StatusBadge
                            label={
                              isEmailVerified
                                ? t("pendingUsers", "emailVerified")
                                : t("pendingUsers", "emailNotVerified")
                            }
                            variant={isEmailVerified ? "success" : "warning"}
                            size="sm"
                          />
                        </div>

                        <p className="mt-1 text-xs text-slate-400">
                          {request.email || t("pendingUsers", "noEmail")} •{" "}
                          {request.role}
                        </p>

                        <div className="mt-2 flex flex-wrap items-center gap-2">
                          {request.username ? (
                            <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/10 px-3 py-1.5 text-xs font-medium text-slate-200">
                              <UserRound className="h-3.5 w-3.5 text-slate-300" />
                              {t("pendingUsers", "username")}:{" "}
                              {request.username}
                            </span>
                          ) : null}

                          {request.shift_number ? (
                            <span className="inline-flex items-center rounded-full border border-white/10 bg-white/10 px-3 py-1.5 text-xs font-medium text-slate-200">
                              {t("common", "shift")}: {request.shift_number}
                            </span>
                          ) : null}
                        </div>

                        <div className="mt-3 flex items-center gap-2 text-xs">
                          {isEmailVerified ? (
                            <>
                              <MailCheck className="h-4 w-4 text-emerald-400" />
                              <span className="font-medium text-emerald-300">
                                {t("pendingUsers", "canApprove")}
                              </span>
                            </>
                          ) : (
                            <>
                              <MailX className="h-4 w-4 text-amber-400" />
                              <span className="font-medium text-amber-300">
                                {t("pendingUsers", "cannotApprove")}
                              </span>
                            </>
                          )}
                        </div>
                      </div>

                      <div className="flex gap-2 self-end lg:self-center">
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
                    </div>
                  </Card>
                );
              })}
            </div>
          </DataStateBoundary>
        </SectionCard>
      </div>
    </DataStateBoundary>
  );
}