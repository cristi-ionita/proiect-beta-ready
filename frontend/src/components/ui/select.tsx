"use client";

import type { SelectHTMLAttributes } from "react";
import { ChevronDown } from "lucide-react";

type SelectProps = SelectHTMLAttributes<HTMLSelectElement> & {
  className?: string;
};

function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

export default function Select({ className, children, ...props }: SelectProps) {
  return (
    <div className="relative w-full">
      <select
        className={cn(
          "h-12 w-full appearance-none rounded-full border border-white/10 bg-white/10 px-5 pr-11 text-sm text-white outline-none backdrop-blur-md transition",
          "hover:bg-white/15",
          "focus:border-white/20 focus:ring-2 focus:ring-white/20",
          "disabled:cursor-not-allowed disabled:opacity-60",
          "[&>option]:bg-[#1e293b] [&>option]:text-white",
          className
        )}
        {...props}
      >
        {children}
      </select>

      <ChevronDown className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-300" />
    </div>
  );
}