"use client";

import { type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { Settings, UserRound } from "lucide-react";

import CardShell from "@/components/patterns/card-shell";
import DataStateBoundary from "@/components/patterns/data-state-boundary";
import StatCard from "@/components/patterns/stat-card";
import { ROUTES } from "@/constants/routes";
import { useProfileSummary } from "@/hooks/profile/use-profile-summary";

type Accent = "blue" | "violet" | "rose" | "emerald";

type ProfileCardKey = "personalData" | "accountSettings";

type ProfileCardConfig = {
  key: ProfileCardKey;
  title: string;
  icon: ReactNode;
  accent: Accent;
  href: string;
};

const PROFILE_CARDS: ProfileCardConfig[] = [
  {
    key: "personalData",
    title: "Date personale",
    icon: <UserRound className="h-6 w-6" />,
    accent: "rose",
    href: `${ROUTES.EMPLOYEE.PROFILE}/personal-data`,
  },
  {
    key: "accountSettings",
    title: "Setări logare cont",
    icon: <Settings className="h-6 w-6" />,
    accent: "emerald",
    href: `${ROUTES.EMPLOYEE.PROFILE}/account`,
  },
];

export default function ProfilePageScreen() {
  const router = useRouter();
  const { data, loading, error } = useProfileSummary();

  return (
    <DataStateBoundary
      isLoading={loading}
      isError={Boolean(error)}
      errorMessage={error ?? "Nu s-au putut încărca datele de profil"}
      isEmpty={!data}
      emptyTitle="Nu există date de profil"
      emptyDescription="Informațiile profilului nu sunt disponibile."
    >
      <div className="space-y-6">
        <section className="grid gap-5 sm:grid-cols-2">
          {PROFILE_CARDS.map((card) => (
            <CardShell key={card.key} accent={card.accent}>
              <StatCard
                title={card.title}
                icon={card.icon}
                onClick={() => router.push(card.href)}
                hideValue // 👈 IMPORTANT
              />
            </CardShell>
          ))}
        </section>
      </div>
    </DataStateBoundary>
  );
}