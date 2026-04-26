"use client";

import type { ReactNode } from "react";

import Card from "@/components/ui/card";

type StatCardProps = {
  title: string;
  value?: string | number;
  icon: ReactNode;
  isActive?: boolean;
  onClick?: () => void;
  className?: string;
  valueClassName?: string;
  hideValue?: boolean;
};

function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

export default function StatCard({
  title,
  value,
  icon,
  isActive = false,
  onClick,
  className,
  valueClassName,
}: StatCardProps) {
  const isInteractive = typeof onClick === "function";

  return (
    <Card
      interactive={isInteractive}
      active={isActive}
      onClick={onClick}
      className={cn("flex min-h-[120px] flex-col gap-2.5", className)}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-[16px] bg-black text-white transition-all duration-300 group-hover:scale-110 group-hover:rotate-1">
          {icon}
        </div>

        {value !== undefined && value !== null ? (
          <span
            className={cn(
              "text-2xl font-semibold tracking-tight text-white",
              valueClassName
            )}
          >
            {value}
          </span>
        ) : null}
      </div>

      <p className="text-[14px] font-semibold tracking-tight text-white">
        {title}
      </p>
    </Card>
  );
}