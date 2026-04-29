"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Send } from "lucide-react";

import Alert from "@/components/ui/alert";
import Button from "@/components/ui/button";
import FormField from "@/components/ui/form-field";
import Input from "@/components/ui/input";
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

  return (
    <div className="space-y-4">
      <Button
        type="button"
        variant="back"
        onClick={() => router.push(ROUTES.EMPLOYEE.LEAVE)}
      >
        <ArrowLeft className="h-4 w-4" />
        {t("common", "back")}
      </Button>

      <SectionCard
        title={t("leave", "submitLeaveRequest")}
        icon={<Send className="h-5 w-5" />}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          {error ? <Alert variant="error" message={error} /> : null}
          {success ? <Alert variant="success" message={success} /> : null}

          <div className="grid gap-4 md:grid-cols-2">
            <FormField label={t("leave", "startDate")} required>
              <Input
                type="date"
                value={startDate}
                onChange={(event) => setStartDate(event.target.value)}
                required
              />
            </FormField>

            <FormField label={t("leave", "endDate")} required>
              <Input
                type="date"
                value={endDate}
                onChange={(event) => setEndDate(event.target.value)}
                required
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

          <div className="flex justify-end gap-3">
            <Button
              type="button"
              variant="secondary"
              onClick={() => router.push(ROUTES.EMPLOYEE.LEAVE)}
            >
              {t("common", "cancel")}
            </Button>

            <Button type="submit" disabled={loading} loading={loading}>
              <Send className="h-4 w-4" />
              {t("leave", "sendRequest")}
            </Button>
          </div>
        </form>
      </SectionCard>
    </div>
  );
}