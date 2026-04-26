"use client";

import { LogOut } from "lucide-react";

type SidebarLogoutButtonProps = {
  label: string;
  onClick: () => void;
};

export default function SidebarLogoutButton({
  label,
  onClick,
}: SidebarLogoutButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full flex-col items-center gap-1.5 rounded-xl p-2.5 text-slate-300 transition-all hover:bg-white/10 hover:text-white"
    >
      <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-black text-white">
        <LogOut className="h-5 w-5" />
      </span>
      <span className="text-center text-[11px] font-medium leading-tight">
        {label}
      </span>
    </button>
  );
}