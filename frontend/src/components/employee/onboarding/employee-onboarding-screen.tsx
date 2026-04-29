"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { FileText, UserRound } from "lucide-react";

import CardShell from "@/components/patterns/card-shell";
import DataStateBoundary from "@/components/patterns/data-state-boundary";
import StatCard from "@/components/patterns/stat-card";
import { useSafeI18n } from "@/hooks/use-safe-i18n";
import { getMyDocuments } from "@/services/documents.api";
import { getMyProfileSummary } from "@/services/profile.api";

type EmployeeProfileSummary = {
  employee_profile?: {
    first_name?: string | null;
    last_name?: string | null;
    phone?: string | null;
    address?: string | null;
  } | null;
};

type DocumentSummary = {
  type?: string | null;
};

function isProfileComplete(profile: EmployeeProfileSummary) {
  const employeeProfile = profile.employee_profile;

  return Boolean(
    employeeProfile?.first_name?.trim() &&
      employeeProfile?.last_name?.trim() &&
      employeeProfile?.phone?.trim() &&
      employeeProfile?.address?.trim()
  );
}

function hasRequiredDocuments(documents: DocumentSummary[]) {
  const types = documents.map((document) =>
    String(document.type || "").toUpperCase()
  );

  return (
    (types.includes("ID_CARD") || types.includes("PASSPORT")) &&
    types.includes("DRIVER_LICENSE")
  );
}

export default function EmployeeOnboardingScreen() {
  const router = useRouter();
  const { t } = useSafeI18n();

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function checkOnboarding() {
      try {
        const [profile, documents] = await Promise.all([
          getMyProfileSummary(),
          getMyDocuments(),
        ]);

        const safeDocuments = Array.isArray(documents) ? documents : [];

        const complete =
          isProfileComplete(profile as EmployeeProfileSummary) &&
          hasRequiredDocuments(safeDocuments);

        if (complete) {
          router.replace("/employee/dashboard");
        }
      } finally {
        setLoading(false);
      }
    }

    void checkOnboarding();
  }, [router]);

  return (
    <DataStateBoundary isLoading={loading} isError={false}>
      <section className="grid gap-5 sm:grid-cols-2">
        <CardShell accent="blue">
          <StatCard
            title={t("documents", "uploadDocuments")}
            icon={<FileText className="h-6 w-6" />}
            onClick={() => router.push("/employee/onboarding/documents")}
          />
        </CardShell>

        <CardShell accent="emerald">
          <StatCard
            title={t("profile", "personalData")}
            icon={<UserRound className="h-6 w-6" />}
            onClick={() => router.push("/employee/onboarding/personal-data")}
          />
        </CardShell>
      </section>
    </DataStateBoundary>
  );
}