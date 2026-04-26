"use client";

import { useEffect, useMemo, useState } from "react";
import { CheckCircle2, XCircle, ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";

import DataStateBoundary from "@/components/patterns/data-state-boundary";
import Button from "@/components/ui/button";
import Card from "@/components/ui/card";
import SectionCard from "@/components/ui/section-card";

import { useAdminLeave } from "@/hooks/admin/use-admin-leave";
import { useSafeI18n } from "@/hooks/use-safe-i18n";
import { listUsers } from "@/services/users.api";
import { formatDate } from "@/lib/utils";

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

  const pendingRequests = useMemo(() => {
    return requests.filter((request) => request.status === "pending");
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

        <SectionCard title={t("leave", "approvals")}>
          <DataStateBoundary
            isEmpty={pendingRequests.length === 0}
            emptyTitle={t("leave", "noPendingRequests")}
          >
            <div className="space-y-3">
              {pendingRequests.map((item) => {
                const user = userMap.get(item.user_id);

                return (
                  <Card key={item.id} className="p-4">
                    <div className="flex justify-between">
                      <div>
                        <p className="font-semibold text-white">
                          {user?.full_name || `User #${item.user_id}`}
                        </p>

                        <p className="mt-1 text-sm text-slate-300">
                          {formatDate(item.start_date, localeTag)} →{" "}
                          {formatDate(item.end_date, localeTag)}
                        </p>
                      </div>

                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          onClick={() => reviewRequest(item.id, "approved")}
                          disabled={savingId === item.id}
                        >
                          <CheckCircle2 className="h-4 w-4" />
                        </Button>

                        <Button
                          size="sm"
                          variant="danger"
                          onClick={() => reviewRequest(item.id, "rejected")}
                          disabled={savingId === item.id}
                        >
                          <XCircle className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          </DataStateBoundary>
        </SectionCard>
      </div>
    </DataStateBoundary>
  );
}