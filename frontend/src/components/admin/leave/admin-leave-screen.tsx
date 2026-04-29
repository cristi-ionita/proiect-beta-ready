"use client";

import { useRouter } from "next/navigation";
import { CalendarDays, CheckCircle2 } from "lucide-react";

import CardShell from "@/components/patterns/card-shell";
import StatCard from "@/components/patterns/stat-card";
import { useSafeI18n } from "@/hooks/use-safe-i18n";

export default function AdminLeaveScreen() {
  const router = useRouter();
  const { t } = useSafeI18n();

  return (
    <section className="grid gap-5 sm:grid-cols-2">
      <CardShell accent="blue">
        <StatCard
          title={t("leave", "approvedLeaves")}
          icon={<CalendarDays className="h-6 w-6" />}
          onClick={() => router.push("/admin/leave/all-leaves")}
        />
      </CardShell>

      <CardShell accent="emerald">
        <StatCard
          title={t("leave", "approvals")}
          icon={<CheckCircle2 className="h-6 w-6" />}
          onClick={() => router.push("/admin/leave/approvals")}
        />
      </CardShell>
    </section>
  );
}