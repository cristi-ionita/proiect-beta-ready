"use client";

import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, CalendarDays, CheckCircle2, User, XCircle } from "lucide-react";
import { useRouter } from "next/navigation";

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

export default function AdminLeaveApprovalsScreen() {
  const router = useRouter();
  const { t, localeTag } = useSafeI18n();

  const loadErrorMessage = t("leave", "failedToLoad");
  const reviewErrorMessage = t("leave", "failedToReview");

  const { requests, loading, error, savingId, reviewRequest } = useAdminLeave({
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

  const pendingRequests = useMemo(
    () => requests.filter((request) => request.status === "pending"),
    [requests]
  );

  return (
    <div className="space-y-6">
      <Button variant="back" onClick={() => router.push("/admin/leave")}>
        <ArrowLeft className="h-4 w-4" />
        {t("common", "back")}
      </Button>

      <SectionCard title={t("leave", "approvals")}>
        <DataStateBoundary
          isLoading={loading}
          isError={Boolean(error)}
          errorMessage={error ?? loadErrorMessage}
          isEmpty={pendingRequests.length === 0}
          emptyTitle={t("leave", "noPendingRequests")}
        >
          <div className="space-y-3">
            {pendingRequests.map((item) => {
              const user = userMap.get(item.user_id);
              const isSaving = savingId === item.id;

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
                  actions={
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={() => reviewRequest(item.id, "approved")}
                        disabled={isSaving}
                      >
                        <CheckCircle2 className="h-4 w-4" />
                      </Button>

                      <Button
                        size="sm"
                        variant="danger"
                        onClick={() => reviewRequest(item.id, "rejected")}
                        disabled={isSaving}
                      >
                        <XCircle className="h-4 w-4" />
                      </Button>
                    </div>
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