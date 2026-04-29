"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, CalendarDays, User } from "lucide-react";

import DataStateBoundary from "@/components/patterns/data-state-boundary";
import ListChip from "@/components/patterns/list-chip";
import ListRow from "@/components/patterns/list-row";
import Button from "@/components/ui/button";
import SectionCard from "@/components/ui/section-card";
import { useAdminLeave } from "@/hooks/admin/use-admin-leave";
import { useSafeI18n } from "@/hooks/use-safe-i18n";
import { formatDate } from "@/lib/utils";
import { listUsers } from "@/services/users.api";
import type { UserItem } from "@/types/user.types";

export default function AdminAllLeavesScreen() {
  const router = useRouter();
  const { t, localeTag } = useSafeI18n();

  const loadErrorMessage = t("leave", "failedToLoad");
  const reviewErrorMessage = t("leave", "failedToReview");

  const { requests, loading, error } = useAdminLeave({
    loadErrorMessage,
    reviewErrorMessage,
  });

  const [users, setUsers] = useState<UserItem[]>([]);

  useEffect(() => {
    async function loadUsers() {
      const data = await listUsers();
      setUsers(Array.isArray(data) ? data : []);
    }

    void loadUsers();
  }, []);

  const userMap = useMemo(() => {
    const map = new Map<number, UserItem>();
    users.forEach((user) => map.set(user.id, user));
    return map;
  }, [users]);

  const approvedLeaves = useMemo(() => {
    return requests
      .filter((request) => request.status === "approved")
      .sort(
        (a, b) =>
          new Date(b.start_date).getTime() - new Date(a.start_date).getTime()
      );
  }, [requests]);

  return (
    <div className="space-y-6">
      <Button variant="back" onClick={() => router.push("/admin/leave")}>
        <ArrowLeft className="h-4 w-4" />
        {t("common", "back")}
      </Button>

      <SectionCard
        title={t("leave", "allApprovedLeaves")}
        icon={<CalendarDays className="h-5 w-5" />}
      >
        <DataStateBoundary
          isLoading={loading}
          isError={Boolean(error)}
          errorMessage={error ?? loadErrorMessage}
          isEmpty={approvedLeaves.length === 0}
          emptyTitle={t("leave", "noApprovedLeaves")}
        >
          <div className="space-y-3">
            {approvedLeaves.map((item) => {
              const user = userMap.get(item.user_id);

              return (
                <ListRow
                  key={item.id}
                  leading={<User className="h-4 w-4" />}
                  title={user?.full_name || `User #${item.user_id}`}
                  subtitle={item.reason || undefined}
                  meta={
                    <ListChip icon={<CalendarDays className="h-3 w-3" />}>
                      {formatDate(item.start_date, localeTag)} →{" "}
                      {formatDate(item.end_date, localeTag)}
                    </ListChip>
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