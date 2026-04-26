"use client";

import { type ReactNode } from "react";
import { ShieldCheck, UserRound, Wrench } from "lucide-react";

type Props = {
  text: any;
  onSelect: (role: "admin" | "employee" | "mechanic") => void;
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
    <button
      type="button"
      onClick={onClick}
      className="group flex h-40 flex-col items-center justify-center gap-3 rounded-[28px] border border-white/10 bg-white/10 shadow-[0_8px_20px_rgba(0,0,0,0.18)] backdrop-blur-md transition-all duration-300 ease-out hover:-translate-y-1.5 hover:bg-white/14 hover:shadow-[0_20px_50px_rgba(0,0,0,0.26)]"
    >
      <div className="flex h-14 w-14 items-center justify-center rounded-[18px] bg-black text-white transition-all duration-300 group-hover:scale-110 group-hover:rotate-1">
        {icon}
      </div>

      <span className="text-[15px] font-semibold tracking-tight text-white">
        {label}
      </span>
    </button>
  );
}