"use client";

import { type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { CarFront, ClipboardCheck } from "lucide-react";

import CardShell from "@/components/patterns/card-shell";
import StatCard from "@/components/patterns/stat-card";
import { ROUTES } from "@/constants/routes";
import { useSafeI18n } from "@/hooks/use-safe-i18n";

type Accent = "blue" | "violet";

type VehicleCardKey = "handover" | "myVehicle";

type VehicleCardConfig = {
  key: VehicleCardKey;
  title: string;
  icon: ReactNode;
  accent: Accent;
  href: string;
};

export default function MyVehicleScreen() {
  const router = useRouter();
  const { t } = useSafeI18n();

  const cards: VehicleCardConfig[] = [
    {
      key: "handover",
      title: t("vehicles", "handover"),
      icon: <ClipboardCheck className="h-6 w-6" />,
      accent: "blue",
      href: `${ROUTES.EMPLOYEE.VEHICLE}/check-vehicle`,
    },
    {
      key: "myVehicle",
      title: t("nav", "myVehicle"),
      icon: <CarFront className="h-6 w-6" />,
      accent: "violet",
      href: `${ROUTES.EMPLOYEE.VEHICLE}/details`,
    },
  ];

  return (
    <section className="grid gap-5 sm:grid-cols-2">
      {cards.map((card) => (
        <CardShell key={card.key} accent={card.accent}>
          <StatCard
            title={card.title}
            icon={card.icon}
            onClick={() => router.push(card.href)}
          />
        </CardShell>
      ))}
    </section>
  );
}