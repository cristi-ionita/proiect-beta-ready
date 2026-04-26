"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, CalendarDays } from "lucide-react";

import DataStateBoundary from "@/components/patterns/data-state-boundary";
import SectionCard from "@/components/ui/section-card";
import Button from "@/components/ui/button";

import { useAdminLeave } from "@/hooks/admin/use-admin-leave";
import { useSafeI18n } from "@/hooks/use-safe-i18n";
import { listUsers } from "@/services/users.api";
import { formatDate } from "@/lib/utils";

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
    <DataStateBoundary
      isLoading={loading}
      isError={Boolean(error)}
      errorMessage={error ?? loadErrorMessage}
    >
      <div className="space-y-6">
        <Button
          variant="ghost"
          onClick={() =>
            router.push(fromDashboard ? "/admin/dashboard" : "/admin/leave")
          }
          className="rounded-full border border-white/10 bg-white/10 px-4 py-2 text-white backdrop-blur-md hover:bg-white/15"
        >
          <ArrowLeft className="h-4 w-4" />
          {t("common", "back")}
        </Button>

        <SectionCard
          title={t("leave", "todayLeavesTitle")}
          icon={<CalendarDays className="h-5 w-5" />}
        >
          <DataStateBoundary
            isEmpty={todayLeaves.length === 0}
            emptyTitle={t("leave", "noTodayLeaves")}
          >
            <div className="space-y-3">
              {todayLeaves.map((item) => {
                const user = userMap.get(item.user_id);

                return (
                  <div
                    key={item.id}
                    className="rounded-xl border border-white/10 bg-white/5 p-4"
                  >
                    <p className="font-semibold text-white">
                      {user?.full_name || `User #${item.user_id}`}
                    </p>

                    <p className="mt-1 text-sm text-slate-300">
                      {formatDate(item.start_date, localeTag)} →{" "}
                      {formatDate(item.end_date, localeTag)}
                    </p>

                    {item.reason ? (
                      <p className="mt-2 text-sm text-slate-400">
                        {item.reason}
                      </p>
                    ) : null}
                  </div>
                );
              })}
            </div>
          </DataStateBoundary>
        </SectionCard>
      </div>
    </DataStateBoundary>
  );
}