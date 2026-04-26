"use client";

import { type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { CarFront, ClipboardCheck } from "lucide-react";

import CardShell from "@/components/patterns/card-shell";
import StatCard from "@/components/patterns/stat-card";
import { ROUTES } from "@/constants/routes";

type Accent = "blue" | "violet";

type VehicleCardKey = "handover" | "myVehicle";

type VehicleCardConfig = {
  key: VehicleCardKey;
  title: string;
  icon: ReactNode;
  accent: Accent;
  href: string;
};

const VEHICLE_CARDS: VehicleCardConfig[] = [
  {
    key: "handover",
    title: "Preluare vehicul",
    icon: <ClipboardCheck className="h-6 w-6" />,
    accent: "blue",
    href: `${ROUTES.EMPLOYEE.VEHICLE}/check-vehicle`,
  },
  {
    key: "myVehicle",
    title: "Vehiculul meu",
    icon: <CarFront className="h-6 w-6" />,
    accent: "violet",
    href: `${ROUTES.EMPLOYEE.VEHICLE}/details`,
  },
];

export default function MyVehicleScreen() {
  const router = useRouter();

  return (
    <div className="space-y-6">
      <section className="grid gap-5 sm:grid-cols-2">
        {VEHICLE_CARDS.map((card) => (
          <CardShell key={card.key} accent={card.accent}>
            <StatCard
              title={card.title}
              icon={card.icon}
              onClick={() => router.push(card.href)}
            />
          </CardShell>
        ))}
      </section>
    </div>
  );
}