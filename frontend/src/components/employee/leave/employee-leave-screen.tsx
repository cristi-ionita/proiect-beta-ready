"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ClipboardList, Send } from "lucide-react";

import CardShell from "@/components/patterns/card-shell";
import StatCard from "@/components/patterns/stat-card";
import { ROUTES } from "@/constants/routes";
import { api } from "@/lib/axios";

type Accent = "blue" | "violet";

type LeaveCardKey = "createLeave" | "leaveHistory";

type LeaveCardConfig = {
  key: LeaveCardKey;
  title: string;
  icon: React.ReactNode;
  accent: Accent;
  href: string;
};

const LEAVE_CARDS: LeaveCardConfig[] = [
  {
    key: "createLeave",
    title: "Trimite cerere",
    icon: <Send className="h-6 w-6" />,
    accent: "blue",
    href: ROUTES.EMPLOYEE.LEAVE_CREATE,
  },
  {
    key: "leaveHistory",
    title: "Cererile mele",
    icon: <ClipboardList className="h-6 w-6" />,
    accent: "violet",
    href: ROUTES.EMPLOYEE.LEAVE_HISTORY,
  },
];

export default function EmployeeLeaveScreen() {
  const router = useRouter();

  const [leaveCount, setLeaveCount] = useState(0);

  useEffect(() => {
    async function loadCount() {
      try {
        const res = await api.get("/leave-requests/me");
        const requests = res.data?.requests ?? [];
        setLeaveCount(requests.length);
      } catch {
        setLeaveCount(0);
      }
    }

    loadCount();
  }, []);

  return (
    <div className="space-y-6">
      <section className="grid gap-5 sm:grid-cols-2">
        {LEAVE_CARDS.map((card) => (
          <CardShell key={card.key} accent={card.accent}>
            <StatCard
              title={card.title}
              icon={card.icon}
              value={card.key === "leaveHistory" ? leaveCount : undefined}
              hideValue={card.key !== "leaveHistory"}
              onClick={() => router.push(card.href)}
            />
          </CardShell>
        ))}
      </section>
    </div>
  );
}