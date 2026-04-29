import type { HTMLAttributes, ReactNode } from "react";

import { cn } from "@/lib/utils";

type CardProps = {
  children: ReactNode;
  interactive?: boolean;
  active?: boolean;
  onClick?: () => void;
  className?: string;
} & Omit<HTMLAttributes<HTMLDivElement>, "onClick">;

const baseStyles =
  "rounded-[26px] border border-white/10 bg-white/10 p-4 shadow-[0_8px_18px_rgba(0,0,0,0.16)] backdrop-blur-md";

const interactiveStyles =
  "group w-full cursor-pointer text-left transition-all duration-300 ease-out hover:-translate-y-1 hover:bg-white/14 hover:shadow-[0_16px_36px_rgba(0,0,0,0.22)] active:scale-[0.985]";

export default function Card({
  children,
  interactive = false,
  active = false,
  onClick,
  className,
  ...props
}: CardProps) {
  const isClickable = interactive && typeof onClick === "function";

  if (isClickable) {
    return (
      <button
        type="button"
        onClick={onClick}
        className={cn(
          baseStyles,
          interactiveStyles,
          active && "ring-2 ring-white/20",
          className
        )}
      >
        {children}
      </button>
    );
  }

  return (
    <div
      className={cn(baseStyles, active && "ring-2 ring-white/20", className)}
      {...props}
    >
      {children}
    </div>
  );
}