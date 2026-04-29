"use client";

import { useMemo } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, FileText, User } from "lucide-react";

import DataStateBoundary from "@/components/patterns/data-state-boundary";
import ListChip from "@/components/patterns/list-chip";
import ListRow from "@/components/patterns/list-row";
import Button from "@/components/ui/button";
import SectionCard from "@/components/ui/section-card";
import { useSafeI18n } from "@/hooks/use-safe-i18n";
import { useActiveUsersTableData } from "@/hooks/users/use-active-users-table-data";
import { useAdminUsersData } from "@/hooks/users/use-admin-users-data";

export default function AdminCompanyDocumentsScreen() {
  const router = useRouter();
  const { t } = useSafeI18n();

  const { data, loading, error } = useAdminUsersData();

  const usersData = useActiveUsersTableData(
    data.users,
    data.leaveRequests,
    data.assignments
  );

  const visibleUsers = useMemo(
    () => usersData.filter((user) => user.role !== "admin"),
    [usersData]
  );

  const fallback = "—";

  return (
    <div className="space-y-6">
      <Button variant="back" onClick={() => router.push("/admin/documents")}>
        <ArrowLeft className="h-4 w-4" />
        {t("common", "back")}
      </Button>

      <SectionCard title={t("nav", "users")}>
        <DataStateBoundary
          isLoading={loading}
          isError={Boolean(error)}
          errorMessage={error ?? t("documents", "failedToLoadUsers")}
          isEmpty={visibleUsers.length === 0}
          emptyTitle={t("documents", "noUsersFound")}
        >
          <div className="space-y-3">
            {visibleUsers.map((user) => (
              <ListRow
                key={user.id}
                leading={<User className="h-4 w-4" />}
                title={user.full_name || `User #${user.id}`}
                meta={
                  <ListChip icon={<User className="h-3 w-3" />}>
                    {t("common", "shift")}: {user.shift_number || fallback}
                  </ListChip>
                }
                actions={
                  <Button
                    size="sm"
                    onClick={() =>
                      router.push(
                        `/admin/documents/company-documents/${user.id}`
                      )
                    }
                  >
                    <FileText className="h-4 w-4" />
                    {t("documents", "uploadDocuments")}
                  </Button>
                }
              />
            ))}
          </div>
        </DataStateBoundary>
      </SectionCard>
    </div>
  );
}