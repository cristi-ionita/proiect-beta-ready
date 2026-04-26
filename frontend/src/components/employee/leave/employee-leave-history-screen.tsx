"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, CalendarDays } from "lucide-react";

import DataStateBoundary from "@/components/patterns/data-state-boundary";
import Button from "@/components/ui/button";
import StatusBadge from "@/components/ui/status-badge";
import { ROUTES } from "@/constants/routes";
import { useSafeI18n } from "@/hooks/use-safe-i18n";
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

function formatDate(value?: string | null) {
  if (!value) return "—";

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;

  return new Intl.DateTimeFormat("ro-RO", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(parsed);
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
  const { t } = useSafeI18n();

  const [data, setData] = useState<LeaveRequestItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function load() {
    try {
      setLoading(true);
      setError("");

      const response =
        await api.get<LeaveRequestListResponse>("/leave-requests/me");

      setData(Array.isArray(response.data?.requests) ? response.data.requests : []);
    } catch (err: any) {
      setError(
        err?.response?.data?.message ||
          err?.response?.data?.detail ||
          err?.message ||
          "Nu am putut încărca cererile de concediu."
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
    <DataStateBoundary
      isLoading={loading}
      isError={Boolean(error)}
      errorMessage={error}
      isEmpty={data.length === 0}
      emptyTitle="Nu ai încă cereri de concediu"
      emptyDescription="Când trimiți o cerere de concediu, o vei vedea aici."
    >
      <div className="space-y-4">
        <Button
          type="button"
          variant="ghost"
          onClick={() => router.push(ROUTES.EMPLOYEE.LEAVE)}
          className="rounded-full border border-white/10 bg-white/10 px-4 py-2 text-white hover:bg-white/15"
        >
          <ArrowLeft className="h-4 w-4" />
          {t("common", "back")}
        </Button>

        <div className="overflow-hidden rounded-[26px] border border-white/10 bg-white/10 backdrop-blur-md">
          <div className="divide-y divide-white/10">
            {data.map((request) => (
              <div
                key={request.id}
                className="flex flex-col gap-3 px-4 py-3 hover:bg-white/5 md:flex-row md:items-center md:justify-between"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-black/30 text-white">
                    <CalendarDays className="h-4 w-4" />
                  </div>

                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-white">
                      {formatDate(request.start_date)} -{" "}
                      {formatDate(request.end_date)}
                    </p>

                    <p className="mt-1 text-xs text-slate-400">
                      Creată la {formatDate(request.created_at)}
                    </p>
                  </div>
                </div>

                <StatusBadge
                  label={getStatusLabel(request.status)}
                  variant={getStatusVariant(request.status)}
                />
              </div>
            ))}
          </div>
        </div>
      </div>
    </DataStateBoundary>
  );
}