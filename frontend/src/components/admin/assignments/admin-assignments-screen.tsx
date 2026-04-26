"use client";

import { useRouter } from "next/navigation";
import { ClipboardList, History, Plus, XCircle } from "lucide-react";

import CardShell from "@/components/patterns/card-shell";
import StatCard from "@/components/patterns/stat-card";

import { useSafeI18n } from "@/hooks/use-safe-i18n";

export default function AdminAssignmentsScreen() {
  const router = useRouter();
  const { t } = useSafeI18n();

  return (
    <div className="space-y-6">
      <section className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
        <CardShell accent="violet">
          <StatCard
            title={t("assignments", "create")}
            icon={<Plus className="h-6 w-6" />}
            onClick={() => router.push("/admin/assignments/create")}
          />
        </CardShell>

        <CardShell accent="blue">
          <StatCard
            title={t("assignments", "activeList")}
            icon={<ClipboardList className="h-6 w-6" />}
            onClick={() => router.push("/admin/assignments/list")}
          />
        </CardShell>

        <CardShell accent="emerald">
          <StatCard
            title={t("assignments", "history")}
            icon={<History className="h-6 w-6" />}
            onClick={() => router.push("/admin/assignments/history")}
          />
        </CardShell>

        <CardShell accent="rose">
          <StatCard
            title="Alocări refuzate"
            icon={<XCircle className="h-6 w-6" />}
            onClick={() => router.push("/admin/assignments/rejected")}
          />
        </CardShell>
      </section>
    </div>
  );
}