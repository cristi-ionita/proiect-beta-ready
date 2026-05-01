"use client";

import { useRouter } from "next/navigation";
import { Users } from "lucide-react";

import ActiveUserRow from "@/components/admin/active-users/active-user-row";
import DataStateBoundary from "@/components/patterns/data-state-boundary";
import ListChip from "@/components/patterns/list-chip";
import Button from "@/components/ui/button";
import SectionCard from "@/components/ui/section-card";
import { useAdminActiveUsers } from "@/hooks/admin/use-admin-active-users";
import { useSafeI18n } from "@/hooks/use-safe-i18n";
import { useActiveUsersTableData } from "@/hooks/users/use-active-users-table-data";

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
        <Button variant="back" onClick={() => router.back()}>
          {t("common", "back")}
        </Button>

        <SectionCard
          title={t("activeUsers", "title")}
          actions={
            <ListChip icon={<Users className="h-3.5 w-3.5" />} variant="blue">
              {activeUsers.length}
            </ListChip>
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