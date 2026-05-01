"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import Alert from "@/components/ui/alert";
import Button from "@/components/ui/button";
import FormField from "@/components/ui/form-field";
import SectionCard from "@/components/ui/section-card";
import Textarea from "@/components/ui/textarea";
import { ROUTES } from "@/constants/routes";
import { useSafeI18n } from "@/hooks/use-safe-i18n";
import { isApiClientError } from "@/lib/api-error";
import { api } from "@/lib/axios";

export default function EmployeeLeaveCreateScreen() {
  const router = useRouter();
  const { t } = useSafeI18n();

  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [reason, setReason] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!startDate || !endDate || !reason.trim()) {
      setSuccess("");
      setError(t("leave", "completeAllFields"));
      return;
    }

    if (new Date(endDate) < new Date(startDate)) {
      setSuccess("");
      setError(t("leave", "endDateAfterStartDate"));
      return;
    }

    try {
      setLoading(true);
      setError("");
      setSuccess("");

      await api.post("/leave-requests", {
        start_date: startDate,
        end_date: endDate,
        reason: reason.trim(),
      });

      setSuccess(t("leave", "requestSentSuccessfully"));
      setStartDate("");
      setEndDate("");
      setReason("");

      window.setTimeout(() => {
        router.push(ROUTES.EMPLOYEE.LEAVE);
      }, 1000);
    } catch (err: unknown) {
      setError(
        isApiClientError(err)
          ? err.message
          : t("leave", "failedToSendRequest")
      );
    } finally {
      setLoading(false);
    }
  }

  const dateInputClass =
  "block h-11 w-full min-w-0 appearance-none rounded-xl border border-white/10 bg-white/10 px-3 text-sm text-white outline-none backdrop-blur-md transition focus:border-white/20 focus:ring-2 focus:ring-white/20 disabled:cursor-not-allowed disabled:opacity-60 leading-[2.75rem] [&::-webkit-datetime-edit]:flex [&::-webkit-datetime-edit]:items-center";

  return (
    <div className="space-y-4">
      <Button
        type="button"
        variant="back"
        onClick={() => router.push(ROUTES.EMPLOYEE.LEAVE)}
      >
        {t("common", "back")}
      </Button>

      <SectionCard title={t("leave", "submitLeaveRequest")}>
        <form onSubmit={handleSubmit} className="w-full min-w-0 space-y-4 overflow-hidden">
          {error ? <Alert variant="error" message={error} /> : null}
          {success ? <Alert variant="success" message={success} /> : null}

          <div className="grid w-full min-w-0 grid-cols-1 gap-4 overflow-hidden sm:grid-cols-2">
            <FormField label={t("leave", "startDate")} required className="min-w-0">
              <input
                type="date"
                value={startDate}
                onChange={(event) => setStartDate(event.target.value)}
                required
                className={dateInputClass}
              />
            </FormField>

            <FormField label={t("leave", "endDate")} required className="min-w-0">
              <input
                type="date"
                value={endDate}
                onChange={(event) => setEndDate(event.target.value)}
                required
                className={dateInputClass}
              />
            </FormField>
          </div>

          <FormField label={t("leave", "reason")} required>
            <Textarea
              value={reason}
              onChange={(event) => setReason(event.target.value)}
              placeholder={t("leave", "reasonPlaceholder")}
              required
            />
          </FormField>

          <div className="flex w-full justify-end">
            <Button
              type="submit"
              disabled={loading}
              loading={loading}
              className="w-auto px-5"
            >
              {t("leave", "sendRequest")}
            </Button>
          </div>
        </form>
      </SectionCard>
    </div>
  );
}