"use client";

import { CarFront, UserRound } from "lucide-react";

import Card from "@/components/ui/card";
import { useSafeI18n } from "@/hooks/use-safe-i18n";
import { cn } from "@/lib/utils";

export type ActiveUserRowData = {
  id: number;
  full_name: string;
  shift_number: string | null;
  vehicle_license_plate: string | null;
};

type ActiveUserRowProps = {
  user: ActiveUserRowData;
  index: number;
};

export default function ActiveUserRow({ user, index }: ActiveUserRowProps) {
  const { t } = useSafeI18n();

  return (
    <Card className="p-4">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[16px] bg-black text-white">
            <span className="text-sm font-semibold">{index + 1}</span>
          </div>

          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <p className="truncate text-base font-semibold tracking-tight text-white">
                {user.full_name}
              </p>

              <span className="inline-flex items-center rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold text-emerald-700">
                {t("common", "active")}
              </span>
            </div>

            <div className="mt-2 flex flex-wrap gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/10 px-3 py-1.5 text-xs font-medium text-slate-200">
                <UserRound className="h-3.5 w-3.5 text-slate-300" />
                {t("common", "shift")}: {user.shift_number || "—"}
              </span>

              <span
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium",
                  user.vehicle_license_plate
                    ? "border border-blue-200 bg-blue-50 text-blue-700"
                    : "border border-white/10 bg-white/10 text-slate-300"
                )}
              >
                <CarFront className="h-3.5 w-3.5" />
                {t("common", "vehicle")}:{" "}
                {user.vehicle_license_plate || "—"}
              </span>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}