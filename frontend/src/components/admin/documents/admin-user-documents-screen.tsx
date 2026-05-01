"use client";

import { useMemo } from "react";
import { useRouter } from "next/navigation";
import { User } from "lucide-react";

import DataStateBoundary from "@/components/patterns/data-state-boundary";
import ListChip from "@/components/patterns/list-chip";
import Button from "@/components/ui/button";
import SectionCard from "@/components/ui/section-card";
import { useSafeI18n } from "@/hooks/use-safe-i18n";
import { useActiveUsersTableData } from "@/hooks/users/use-active-users-table-data";
import { useAdminUsersData } from "@/hooks/users/use-admin-users-data";

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

  const fallback = "—";

  return (
    <div className="space-y-6">
      <Button
        variant="back"
        onClick={() => router.push("/admin/documents")}
      >
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
              <div
                key={user.id}
                className="flex items-center gap-3 rounded-3xl border border-white/10 bg-white/10 p-4"
              >
                {/* ICON */}
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-black/60 text-white">
                  <User className="h-4 w-4" />
                </div>

                {/* TEXT */}
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-bold text-white">
                    {user.full_name || `User #${user.id}`}
                  </p>

                  <div className="mt-1">
                    <ListChip icon={<User className="h-3 w-3" />}>
                      {t("common", "shift")}:{" "}
                      {user.shift_number || fallback}
                    </ListChip>
                  </div>
                </div>

                {/* BUTTON */}
                <Button
                  size="sm"
                  className="shrink-0 px-4"
                  onClick={() =>
                    router.push(
                      `/admin/documents/user-documents/${user.id}`
                    )
                  }
                >
                  Documente
                </Button>
              </div>
            ))}
          </div>
        </DataStateBoundary>
      </SectionCard>
    </div>
  );
}