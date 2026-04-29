"use client";

import { type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { Settings, UserRound } from "lucide-react";

import CardShell from "@/components/patterns/card-shell";
import DataStateBoundary from "@/components/patterns/data-state-boundary";
import StatCard from "@/components/patterns/stat-card";
import { ROUTES } from "@/constants/routes";
import { useSafeI18n } from "@/hooks/use-safe-i18n";
import { useProfileSummary } from "@/hooks/profile/use-profile-summary";

type Accent = "rose" | "emerald";

type ProfileCardKey = "personalData" | "accountSettings";

type ProfileCardConfig = {
  key: ProfileCardKey;
  title: string;
  icon: ReactNode;
  accent: Accent;
  href: string;
};

export default function ProfilePageScreen() {
  const router = useRouter();
  const { t } = useSafeI18n();
  const { data, loading, error } = useProfileSummary();

  const cards: ProfileCardConfig[] = [
    {
      key: "personalData",
      title: t("profile", "personalData"),
      icon: <UserRound className="h-6 w-6" />,
      accent: "rose",
      href: `${ROUTES.EMPLOYEE.PROFILE}/personal-data`,
    },
    {
      key: "accountSettings",
      title: t("profile", "loginSettings"),
      icon: <Settings className="h-6 w-6" />,
      accent: "emerald",
      href: `${ROUTES.EMPLOYEE.PROFILE}/account`,
    },
  ];

  return (
    <DataStateBoundary
      isLoading={loading}
      isError={Boolean(error)}
      errorMessage={error ?? t("profile", "failedToLoadProfile")}
      isEmpty={!data}
      emptyTitle={t("profile", "noProfileData")}
      emptyDescription={t("profile", "profileDataUnavailable")}
    >
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
    </DataStateBoundary>
  );
}