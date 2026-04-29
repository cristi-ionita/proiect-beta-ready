"use client";

import { CarFront, UserRound } from "lucide-react";

import ListChip from "@/components/patterns/list-chip";
import ListRow from "@/components/patterns/list-row";
import StatusBadge from "@/components/ui/status-badge";
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
  const fallback = "—";

  return (
    <ListRow
      leading={<span className="text-xs font-semibold">{index + 1}</span>}
      title={user.full_name || fallback}
      badge={
        <StatusBadge
          label={t("common", "active")}
          variant="success"
          size="sm"
        />
      }
      meta={
        <>
          <ListChip icon={<UserRound className="h-3 w-3" />}>
            {user.shift_number || fallback}
          </ListChip>

          <ListChip
            icon={<CarFront className="h-3 w-3" />}
            variant={user.vehicle_license_plate ? "blue" : "default"}
          >
            {user.vehicle_license_plate || fallback}
          </ListChip>
        </>
      }
    />
  );
}