"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, CarFront } from "lucide-react";

import DataStateBoundary from "@/components/patterns/data-state-boundary";
import Button from "@/components/ui/button";
import FormField from "@/components/ui/form-field";
import Input from "@/components/ui/input";
import SectionCard from "@/components/ui/section-card";
import Textarea from "@/components/ui/textarea";
import { ROUTES } from "@/constants/routes";
import { useReportIssue } from "@/hooks/issues/use-report-issue";
import { useMyVehicle } from "@/hooks/vehicles/use-my-vehicle";

export default function ReportIssueForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const from = searchParams.get("from");

  const backHref =
    from === "dashboard" ? "/employee/dashboard" : ROUTES.EMPLOYEE.ISSUES;

  const { loading, error, success, submit } = useReportIssue();
  const { data: vehicleData, loading: vehicleLoading } = useMyVehicle();

  const [needServiceInKm, setNeedServiceInKm] = useState("");
  const [needBrakes, setNeedBrakes] = useState(false);
  const [needTires, setNeedTires] = useState(false);
  const [needOil, setNeedOil] = useState(false);
  const [dashboardChecks, setDashboardChecks] = useState("");
  const [otherProblems, setOtherProblems] = useState("");

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const result = await submit({
      need_service_in_km: needServiceInKm ? Number(needServiceInKm) : undefined,
      need_brakes: needBrakes,
      need_tires: needTires,
      need_oil: needOil,
      dashboard_checks: dashboardChecks || undefined,
      other_problems: otherProblems || undefined,
    });

    if (result) {
      router.push(backHref);
    }
  }

  return (
    <DataStateBoundary
      isLoading={vehicleLoading}
      loadingText="Se încarcă datele vehiculului..."
    >
      <div className="space-y-4">
        <Button
          type="button"
          variant="ghost"
          onClick={() => router.push(backHref)}
          className="rounded-full border border-white/10 bg-white/10 px-4 py-2 text-white hover:bg-white/15"
        >
          <ArrowLeft className="h-4 w-4" />
          Înapoi
        </Button>

        {!vehicleData?.assignment ? (
          <SectionCard
            title="Raportează problemă"
            icon={<CarFront className="h-5 w-5" />}
          >
            <p className="text-sm text-slate-300">
              Nu poți raporta o problemă până când nu ai un vehicul alocat.
            </p>
          </SectionCard>
        ) : (
          <SectionCard
            title="Raportează problemă"
            icon={<CarFront className="h-5 w-5" />}
          >
            <form onSubmit={handleSubmit} className="space-y-4">
              {error ? (
                <DataStateBoundary isError errorMessage={error}>
                  <div />
                </DataStateBoundary>
              ) : null}

              {success ? (
                <p className="text-sm font-semibold text-emerald-400">
                  {success}
                </p>
              ) : null}

              <FormField label="Service necesar în km">
                <Input
                  value={needServiceInKm}
                  onChange={(event) => setNeedServiceInKm(event.target.value)}
                  placeholder="Opțional"
                  inputMode="numeric"
                />
              </FormField>

              <div className="grid gap-3 sm:grid-cols-3">
                <IssueCheckbox
                  label="Frâne"
                  checked={needBrakes}
                  onChange={setNeedBrakes}
                />

                <IssueCheckbox
                  label="Anvelope"
                  checked={needTires}
                  onChange={setNeedTires}
                />

                <IssueCheckbox
                  label="Ulei"
                  checked={needOil}
                  onChange={setNeedOil}
                />
              </div>

              <FormField label="Verificări / martori bord">
                <Textarea
                  value={dashboardChecks}
                  onChange={(event) => setDashboardChecks(event.target.value)}
                  placeholder="Martori aprinși sau avertizări din bord"
                />
              </FormField>

              <FormField label="Alte probleme">
                <Textarea
                  value={otherProblems}
                  onChange={(event) => setOtherProblems(event.target.value)}
                  placeholder="Descrie problema"
                />
              </FormField>

              <Button
                type="submit"
                disabled={loading}
                loading={loading}
                className="rounded-xl"
              >
                Trimite problema
              </Button>
            </form>
          </SectionCard>
        )}
      </div>
    </DataStateBoundary>
  );
}

function IssueCheckbox({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <label className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-sm font-semibold text-slate-200">
      <input
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
        className="h-4 w-4"
      />
      {label}
    </label>
  );
}