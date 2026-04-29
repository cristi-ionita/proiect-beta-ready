"use client";

import { useRouter } from "next/navigation";
import { FileText, Users } from "lucide-react";

import CardShell from "@/components/patterns/card-shell";
import StatCard from "@/components/patterns/stat-card";
import { useSafeI18n } from "@/hooks/use-safe-i18n";

export default function AdminDocumentsScreen() {
  const router = useRouter();
  const { t } = useSafeI18n();

  return (
    <div className="space-y-6">
      <section className="grid gap-5 sm:grid-cols-2 xl:grid-cols-2">
        <CardShell accent="blue">
          <StatCard
            title={t("documents", "userDocuments")}
            icon={<Users className="h-6 w-6" />}
            onClick={() => router.push("/admin/documents/user-documents")}
          />
        </CardShell>

        <CardShell accent="emerald">
          <StatCard
            title={t("documents", "contractPayslip")}
            icon={<FileText className="h-6 w-6" />}
            onClick={() => router.push("/admin/documents/company-documents")}
          />
        </CardShell>
      </section>
    </div>
  );
}