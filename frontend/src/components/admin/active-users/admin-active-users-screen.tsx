"use client";

import { useRouter } from "next/navigation";
import { ArrowLeft, Users } from "lucide-react";

import ActiveUserRow from "@/components/admin/active-users/active-user-row";
import DataStateBoundary from "@/components/patterns/data-state-boundary";
import Button from "@/components/ui/button";
import SectionCard from "@/components/ui/section-card";
import { useAdminActiveUsers } from "@/hooks/admin/use-admin-active-users";
import { useActiveUsersTableData } from "@/hooks/users/use-active-users-table-data";
import { useSafeI18n } from "@/hooks/use-safe-i18n";

export default function AdminActiveUsersScreen() {
  const router = useRouter();
  const { t } = useSafeI18n();

  const { users, leaveRequests, assignments, loading, error } =
    useAdminActiveUsers({
      errorMessage: t("activeUsers", "failedToLoad"),
    });

  const activeUsers = useActiveUsersTableData(
    users,
    leaveRequests,
    assignments
  );

  return (
    <DataStateBoundary
      isLoading={loading}
      isError={Boolean(error)}
      errorMessage={error ?? t("activeUsers", "failedToLoad")}
    >
      <div className="space-y-6">
        <div className="flex items-center justify-start">
          <Button
            variant="ghost"
            onClick={() => router.back()}
            className="rounded-full border border-white/10 bg-white/10 px-4 py-2 text-white backdrop-blur-md hover:bg-white/15"
          >
            <ArrowLeft className="h-4 w-4" />
            {t("common", "back")}
          </Button>
        </div>

        <SectionCard
          title={t("activeUsers", "title")}
          actions={
            <div className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-700">
              <Users className="h-3.5 w-3.5" />
              {activeUsers.length}
            </div>
          }
        >
          <DataStateBoundary
            isEmpty={activeUsers.length === 0}
            emptyTitle={t("activeUsers", "emptyToday")}
          >
            <div className="space-y-3">
              {activeUsers.map((user, index) => (
                <ActiveUserRow key={user.id} user={user} index={index} />
              ))}
            </div>
          </DataStateBoundary>
        </SectionCard>
      </div>
    </DataStateBoundary>
  );
}