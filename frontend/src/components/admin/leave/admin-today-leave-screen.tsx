"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { CalendarDays, User } from "lucide-react";

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

function isTodayInRange(startDate: string, endDate: string) {
  const today = new Date();
  const start = new Date(startDate);
  const end = new Date(endDate);

  today.setHours(0, 0, 0, 0);
  start.setHours(0, 0, 0, 0);
  end.setHours(23, 59, 59, 999);

  return start <= today && today <= end;
}

export default function AdminTodayLeaveScreen() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { t, localeTag } = useSafeI18n();

  const fromDashboard = searchParams.get("from") === "dashboard";

  const loadErrorMessage = t("leave", "failedToLoadRecords");
  const reviewErrorMessage = t("leave", "failedToUpdate");

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

  const todayLeaves = useMemo(() => {
    return requests
      .filter(
        (item) =>
          item.status === "approved" &&
          isTodayInRange(item.start_date, item.end_date)
      )
      .sort(
        (a, b) =>
          new Date(a.start_date).getTime() - new Date(b.start_date).getTime()
      );
  }, [requests]);

  return (
    <div className="space-y-6">
      <Button
        variant="back"
        onClick={() =>
          router.push(fromDashboard ? "/admin/dashboard" : "/admin/leave")
        }
      >
        {t("common", "back")}
      </Button>

      <SectionCard
        title={t("leave", "todayLeavesTitle")}
        icon={<CalendarDays className="h-5 w-5" />}
      >
        <DataStateBoundary
          isLoading={loading}
          isError={Boolean(error)}
          errorMessage={error ?? loadErrorMessage}
          isEmpty={todayLeaves.length === 0}
          emptyTitle={t("leave", "noTodayLeaves")}
        >
          <div className="space-y-3">
            {todayLeaves.map((item) => {
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