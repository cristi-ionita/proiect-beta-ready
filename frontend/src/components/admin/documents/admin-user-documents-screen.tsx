"use client";

import { useMemo } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, FileText, User } from "lucide-react";

import DataStateBoundary from "@/components/patterns/data-state-boundary";
import SectionCard from "@/components/ui/section-card";
import Button from "@/components/ui/button";

import { useSafeI18n } from "@/hooks/use-safe-i18n";
import { useAdminUsersData } from "@/hooks/admin/use-admin-users-data";
import { useActiveUsersTableData } from "@/hooks/users/use-active-users-table-data";

export default function AdminUserDocumentsScreen() {
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

  return (
    <DataStateBoundary
      isLoading={loading}
      isError={Boolean(error)}
      errorMessage={error ?? t("documents", "failedToLoadUsers")}
    >
      <div className="space-y-6">
        <div className="flex items-center justify-start">
          <Button
            variant="ghost"
            onClick={() => router.push("/admin/documents")}
            className="rounded-full border border-white/10 bg-white/10 px-4 py-2 text-white backdrop-blur-md hover:bg-white/15"
          >
            <ArrowLeft className="h-4 w-4" />
            {t("common", "back")}
          </Button>
        </div>

        <SectionCard title={t("nav", "users")}>
          <DataStateBoundary
            isEmpty={visibleUsers.length === 0}
            emptyTitle={t("documents", "noUsersFound")}
          >
            <div className="space-y-3">
              {visibleUsers.map((user) => (
                <div
                  key={user.id}
                  className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 p-4"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-black/30">
                      <User className="h-4 w-4 text-white" />
                    </div>

                    <div>
                      <p className="font-semibold text-white">
                        {user.full_name || `User #${user.id}`}
                      </p>

                      <p className="text-sm text-slate-400">
                        {t("common", "shift")}: {user.shift_number || "—"}
                      </p>
                    </div>
                  </div>

                  <Button
                    size="sm"
                    onClick={() =>
                      router.push(`/admin/documents/user-documents/${user.id}`)
                    }
                    className="rounded-full"
                  >
                    <FileText className="h-4 w-4" />
                    {t("documents", "viewDocuments")}
                  </Button>
                </div>
              ))}
            </div>
          </DataStateBoundary>
        </SectionCard>
      </div>
    </DataStateBoundary>
  );
}