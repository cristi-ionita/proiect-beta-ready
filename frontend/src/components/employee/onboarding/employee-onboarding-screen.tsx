"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { FileText, UserRound } from "lucide-react";

import CardShell from "@/components/patterns/card-shell";
import DataStateBoundary from "@/components/patterns/data-state-boundary";
import StatCard from "@/components/patterns/stat-card";

import { getMyDocuments } from "@/services/documents.api";
import { getMyProfileSummary } from "@/services/profile.api";

function isProfileComplete(profile: any) {
  return Boolean(
    profile?.employee_profile?.first_name &&
      profile?.employee_profile?.last_name &&
      profile?.employee_profile?.phone &&
      profile?.employee_profile?.address
  );
}

function hasDocs(documents: any[]) {
  const types = documents.map((d) => String(d.type).toUpperCase());

  return (
    (types.includes("ID_CARD") || types.includes("PASSPORT")) &&
    types.includes("DRIVER_LICENSE")
  );
}

export default function EmployeeOnboardingScreen() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [complete, setComplete] = useState(false);

  useEffect(() => {
    async function check() {
      try {
        const [profile, docs] = await Promise.all([
          getMyProfileSummary(),
          getMyDocuments(),
        ]);

        const done = isProfileComplete(profile) && hasDocs(docs);

        setComplete(done);

        if (done) {
          router.replace("/employee/dashboard");
        }
      } finally {
        setLoading(false);
      }
    }

    void check();
  }, [router]);

  return (
    <DataStateBoundary isLoading={loading} isError={false}>
      <div className="space-y-6">
        <section className="grid gap-5 sm:grid-cols-2 xl:grid-cols-2">
          <CardShell accent="blue">
            <StatCard
              title="Documente obligatorii"
              icon={<FileText className="h-6 w-6" />}
              onClick={() => router.push("/employee/onboarding/documents")}
            />
          </CardShell>

          <CardShell accent="emerald">
            <StatCard
              title="Date personale"
              icon={<UserRound className="h-6 w-6" />}
              onClick={() => router.push("/employee/onboarding/personal-data")}
            />
          </CardShell>
        </section>
      </div>
    </DataStateBoundary>
  );
}