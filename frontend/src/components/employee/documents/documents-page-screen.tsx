"use client";

import { useMemo, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { FilePlus2, Files } from "lucide-react";

import CardShell from "@/components/patterns/card-shell";
import DataStateBoundary from "@/components/patterns/data-state-boundary";
import StatCard from "@/components/patterns/stat-card";
import { ROUTES } from "@/constants/routes";
import { useMyDocuments } from "@/hooks/documents/use-my-documents";

type Accent = "blue" | "violet";

type DocumentCardKey = "myDocuments" | "companyDocuments";

type DocumentCardConfig = {
  key: DocumentCardKey;
  title: string;
  icon: ReactNode;
  accent: Accent;
  href: string;
};

const DOCUMENT_CARDS: DocumentCardConfig[] = [
  {
    key: "myDocuments",
    title: "Documente personale",
    icon: <FilePlus2 className="h-6 w-6" />,
    accent: "blue",
    href: `${ROUTES.EMPLOYEE.DOCUMENTS}/my-documents`,
  },
  {
    key: "companyDocuments",
    title: "Contract & Payslips",
    icon: <Files className="h-6 w-6" />,
    accent: "violet",
    href: `${ROUTES.EMPLOYEE.DOCUMENTS}/contract`,
  },
];

export default function DocumentsPageScreen() {
  const router = useRouter();
  const { data, loading, error } = useMyDocuments();

  const documents = Array.isArray(data) ? data : [];

  const safeCounts = useMemo(() => {
    const myDocuments = documents.filter((doc) => doc.category === "personal");

    const companyDocuments = documents.filter(
      (doc) => doc.type === "contract" || doc.type === "payslip"
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
      errorMessage={error ?? "Nu s-au putut încărca documentele"}
      isEmpty={documents.length === 0}
      emptyTitle="Nu există documente"
      emptyDescription="Documentele vor apărea aici după încărcare."
    >
      <div className="space-y-6">
        <section className="grid gap-5 sm:grid-cols-2">
          {DOCUMENT_CARDS.map((card) => (
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
      </div>
    </DataStateBoundary>
  );
}