"use client";

import { useMemo, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { FilePlus2, Files } from "lucide-react";

import CardShell from "@/components/patterns/card-shell";
import DataStateBoundary from "@/components/patterns/data-state-boundary";
import StatCard from "@/components/patterns/stat-card";
import { ROUTES } from "@/constants/routes";
import { useMyDocuments } from "@/hooks/documents/use-my-documents";
import { useSafeI18n } from "@/hooks/use-safe-i18n";

type Accent = "blue" | "violet";

type DocumentCardKey = "myDocuments" | "companyDocuments";

type DocumentCardConfig = {
  key: DocumentCardKey;
  title: string;
  icon: ReactNode;
  accent: Accent;
  href: string;
};

export default function DocumentsPageScreen() {
  const router = useRouter();
  const { t } = useSafeI18n();
  const { data, loading, error } = useMyDocuments();

  const documents = Array.isArray(data) ? data : [];

  const cards: DocumentCardConfig[] = [
    {
      key: "myDocuments",
      title: t("documents", "userDocuments"),
      icon: <FilePlus2 className="h-6 w-6" />,
      accent: "blue",
      href: `${ROUTES.EMPLOYEE.DOCUMENTS}/my-documents`,
    },
    {
      key: "companyDocuments",
      title: t("documents", "contractPayslip"),
      icon: <Files className="h-6 w-6" />,
      accent: "violet",
      href: `${ROUTES.EMPLOYEE.DOCUMENTS}/contract`,
    },
  ];

  const safeCounts = useMemo(() => {
    const myDocuments = documents.filter(
      (document) => document.category === "personal"
    );

    const companyDocuments = documents.filter(
      (document) => document.type === "contract" || document.type === "payslip"
    );

    return {
      myDocuments: myDocuments.length,
      companyDocuments: companyDocuments.length,
    };
  }, [documents]);

  return (
    <DataStateBoundary
      isLoading={loading}
      isError={Boolean(error)}
      errorMessage={error ?? t("documents", "failedToLoadDocuments")}
    >
      <section className="grid gap-5 sm:grid-cols-2">
        {cards.map((card) => (
          <CardShell key={card.key} accent={card.accent}>
            <StatCard
              title={card.title}
              value={safeCounts[card.key]}
              icon={card.icon}
              onClick={() => router.push(card.href)}
            />
          </CardShell>
        ))}
      </section>
    </DataStateBoundary>
  );
}