"use client";

import { useRouter } from "next/navigation";
import { List, Plus } from "lucide-react";

import CardShell from "@/components/patterns/card-shell";
import DataStateBoundary from "@/components/patterns/data-state-boundary";
import StatCard from "@/components/patterns/stat-card";
import { useAdminVehicles } from "@/hooks/admin/use-admin-vehicles";
import { useSafeI18n } from "@/hooks/use-safe-i18n";

export default function AdminVehiclesScreen() {
  const router = useRouter();
  const { t } = useSafeI18n();
  const { vehicles, loading, error } = useAdminVehicles();

  return (
    <DataStateBoundary
      isLoading={loading}
      isError={Boolean(error)}
      errorMessage={error ?? t("vehicles", "failedToLoad")}
    >
      <section className="grid gap-5 sm:grid-cols-2">
        <CardShell accent="violet">
          <StatCard
            title={t("vehicles", "createTitle")}
            icon={<Plus className="h-6 w-6" />}
            onClick={() => router.push("/admin/vehicles/create")}
          />
        </CardShell>

        <CardShell accent="blue">
          <StatCard
            title={t("vehicles", "listTitle")}
            value={vehicles.length}
            icon={<List className="h-6 w-6" />}
            onClick={() => router.push("/admin/vehicles/list")}
          />
        </CardShell>
      </section>
    </DataStateBoundary>
  );
}