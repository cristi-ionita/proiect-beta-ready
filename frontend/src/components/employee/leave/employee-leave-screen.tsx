"use client";

import { useEffect, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { ClipboardList, Send } from "lucide-react";

import CardShell from "@/components/patterns/card-shell";
import StatCard from "@/components/patterns/stat-card";
import { ROUTES } from "@/constants/routes";
import { useSafeI18n } from "@/hooks/use-safe-i18n";
import { api } from "@/lib/axios";

type Accent = "blue" | "violet";

type LeaveCardKey = "createLeave" | "leaveHistory";

type LeaveCardConfig = {
  key: LeaveCardKey;
  title: string;
  icon: ReactNode;
  accent: Accent;
  href: string;
};

export default function EmployeeLeaveScreen() {
  const router = useRouter();
  const { t } = useSafeI18n();

  const [leaveCount, setLeaveCount] = useState(0);

  const cards: LeaveCardConfig[] = [
    {
      key: "createLeave",
      title: t("leave", "submitLeaveRequest"),
      icon: <Send className="h-6 w-6" />,
      accent: "blue",
      href: ROUTES.EMPLOYEE.LEAVE_CREATE,
    },
    {
      key: "leaveHistory",
      title: t("leave", "approvedLeaves"),
      icon: <ClipboardList className="h-6 w-6" />,
      accent: "violet",
      href: ROUTES.EMPLOYEE.LEAVE_HISTORY,
    },
  ];

  useEffect(() => {
    async function loadCount() {
      try {
        const response = await api.get("/leave-requests/me");
        const requests = response.data?.requests ?? [];

        setLeaveCount(Array.isArray(requests) ? requests.length : 0);
      } catch {
        setLeaveCount(0);
      }
    }

    void loadCount();
  }, []);

  return (
    <section className="grid gap-5 sm:grid-cols-2">
      {cards.map((card) => (
        <CardShell key={card.key} accent={card.accent}>
          <StatCard
          title={card.title}
          icon={card.icon}
          value={card.key === "leaveHistory" ? leaveCount : undefined}
          onClick={() => router.push(card.href)}
          />
        </CardShell>
      ))}
    </section>
  );
}