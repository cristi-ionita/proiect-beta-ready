"use client";

import { CarFront, UserRound } from "lucide-react";

import ListChip from "@/components/patterns/list-chip";
import ListRow from "@/components/patterns/list-row";
import { useSafeI18n } from "@/hooks/use-safe-i18n";

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
    <ListRow
      leading={
        <span className="text-xs font-semibold text-slate-400">
          {index + 1}
        </span>
      }
      title={
        <div className="flex flex-col gap-1">
          {/* LINIA 1: NUME + MASINA */}
          <div className="flex items-center justify-between gap-3">
            <span className="font-semibold text-white truncate">
              {user.full_name}
            </span>

            {user.vehicle_license_plate ? (
              <ListChip
                icon={<CarFront className="h-3 w-3" />}
                variant="blue"
              >
                {user.vehicle_license_plate}
              </ListChip>
            ) : null}
          </div>

          {/* LINIA 2: TURA */}
          <div>
            <ListChip icon={<UserRound className="h-3 w-3" />}>
              {user.shift_number ? `Tura ${user.shift_number}` : "—"}
            </ListChip>
          </div>
        </div>
      }
      meta={null}
      actions={null} // 🔥 IMPORTANT — evită orice spațiu gol în dreapta
    />
  );
}