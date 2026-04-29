"use client";

import { type ReactNode } from "react";
import { ShieldCheck, UserRound, Wrench } from "lucide-react";

import Card from "@/components/ui/card";

type LoginRole = "admin" | "employee" | "mechanic";

type RoleSelectorText = {
  admin: string;
  employee: string;
  mechanic: string;
};

type Props = {
  text: RoleSelectorText;
  onSelect: (role: LoginRole) => void;
};

export default function RoleSelector({ text, onSelect }: Props) {
  return (
    <div className="grid gap-4 md:grid-cols-3">
      <RoleCard
        icon={<ShieldCheck className="h-6 w-6" />}
        label={text.admin}
        onClick={() => onSelect("admin")}
      />

      <RoleCard
        icon={<UserRound className="h-6 w-6" />}
        label={text.employee}
        onClick={() => onSelect("employee")}
      />

      <RoleCard
        icon={<Wrench className="h-6 w-6" />}
        label={text.mechanic}
        onClick={() => onSelect("mechanic")}
      />
    </div>
  );
}

function RoleCard({
  icon,
  label,
  onClick,
}: {
  icon: ReactNode;
  label: string;
  onClick: () => void;
}) {
  return (
    <Card
      interactive
      onClick={onClick}
      className="flex h-40 flex-col items-center justify-center gap-3"
    >
      <div className="flex h-14 w-14 items-center justify-center rounded-[18px] bg-black text-white transition group-hover:scale-110 group-hover:rotate-1">
        {icon}
      </div>

      <span className="text-[15px] font-semibold tracking-tight text-white">
        {label}
      </span>
    </Card>
  );
}