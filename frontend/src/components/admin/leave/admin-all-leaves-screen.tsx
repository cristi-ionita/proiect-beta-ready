"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, CalendarDays } from "lucide-react";

import DataStateBoundary from "@/components/patterns/data-state-boundary";
import SectionCard from "@/components/ui/section-card";
import Button from "@/components/ui/button";

import { useAdminLeave } from "@/hooks/admin/use-admin-leave";
import { useSafeI18n } from "@/hooks/use-safe-i18n";
import { listUsers } from "@/services/users.api";
import { formatDate } from "@/lib/utils";

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
    <DataStateBoundary
      isLoading={loading}
      isError={Boolean(error)}
      errorMessage={error ?? loadErrorMessage}
    >
      <div className="space-y-6">
        <Button
          variant="ghost"
          onClick={() => router.push("/admin/leave")}
          className="rounded-full border border-white/10 bg-white/10 px-4 py-2 text-white"
        >
          <ArrowLeft className="h-4 w-4" />
          {t("common", "back")}
        </Button>

        <SectionCard
          title={t("leave", "allApprovedLeaves")}
          icon={<CalendarDays className="h-5 w-5" />}
        >
          <DataStateBoundary
            isEmpty={approvedLeaves.length === 0}
            emptyTitle={t("leave", "noApprovedLeaves")}
          >
            <div className="space-y-3">
              {approvedLeaves.map((item) => {
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