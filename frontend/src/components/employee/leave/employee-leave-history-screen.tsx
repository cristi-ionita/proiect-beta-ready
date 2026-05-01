"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { CalendarDays } from "lucide-react";

import DataStateBoundary from "@/components/patterns/data-state-boundary";
import ListChip from "@/components/patterns/list-chip";
import ListRow from "@/components/patterns/list-row";
import Button from "@/components/ui/button";
import SectionCard from "@/components/ui/section-card";
import StatusBadge from "@/components/ui/status-badge";
import { ROUTES } from "@/constants/routes";
import { useSafeI18n } from "@/hooks/use-safe-i18n";
import { isApiClientError } from "@/lib/api-error";
import { api } from "@/lib/axios";

type LeaveRequestStatus = "pending" | "approved" | "rejected" | "canceled";

type LeaveRequestItem = {
  id: number;
  user_id: number;
  start_date: string;
  end_date: string;
  reason: string | null;
  status: LeaveRequestStatus;
  reviewed_by_admin_id?: number | null;
  reviewed_at?: string | null;
  rejection_reason?: string | null;
  created_at: string;
  updated_at: string;
};

type LeaveRequestListResponse = {
  requests: LeaveRequestItem[];
};

function formatDateOnly(value: string, localeTag: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat(localeTag, {
    day: "numeric",
    month: "numeric",
    year: "numeric",
  }).format(date);
}

function getStatusVariant(status: LeaveRequestStatus) {
  if (status === "approved") return "success";
  if (status === "rejected") return "danger";
  if (status === "canceled") return "neutral";

  return "warning";
}

function getStatusLabel(status: LeaveRequestStatus) {
  if (status === "approved") return "Aprobată";
  if (status === "rejected") return "Respinsă";
  if (status === "canceled") return "Anulată";

  return "În așteptare";
}

export default function EmployeeLeaveHistoryScreen() {
  const router = useRouter();
  const { t, localeTag } = useSafeI18n();

  const [data, setData] = useState<LeaveRequestItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function load() {
    try {
      setLoading(true);
      setError("");

      const response = await api.get<LeaveRequestListResponse>(
        "/leave-requests/me"
      );

      setData(
        Array.isArray(response.data?.requests) ? response.data.requests : []
      );
    } catch (err: unknown) {
      setError(
        isApiClientError(err) ? err.message : t("leave", "failedToLoadRecords")
      );
      setData([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  return (
    <div className="space-y-4">
      <Button
        type="button"
        variant="back"
        onClick={() => router.push(ROUTES.EMPLOYEE.LEAVE)}
      >
        {t("common", "back")}
      </Button>

      <SectionCard title={t("leave", "approvedLeaves")}>
        <DataStateBoundary
          isLoading={loading}
          isError={Boolean(error)}
          errorMessage={error}
          isEmpty={data.length === 0}
          emptyTitle={t("leave", "noPendingRequests")}
          emptyDescription={t("leave", "submitLeaveRequest")}
        >
          <div className="space-y-2.5">
            {data.map((request) => (
              <ListRow
                key={request.id}
                leading={<CalendarDays className="h-4 w-4 shrink-0" />}
                title={`${formatDateOnly(
                  request.start_date,
                  localeTag
                )} → ${formatDateOnly(request.end_date, localeTag)}`}
                subtitle={request.reason || undefined}
                badge={
                  <StatusBadge
                    label={getStatusLabel(request.status)}
                    variant={getStatusVariant(request.status)}
                  />
                }
                meta={
                  request.rejection_reason ? (
                    <ListChip variant="rose">
                      Motiv respingere: {request.rejection_reason}
                    </ListChip>
                  ) : undefined
                }
              />
            ))}
          </div>
        </DataStateBoundary>
      </SectionCard>
    </div>
  );
}