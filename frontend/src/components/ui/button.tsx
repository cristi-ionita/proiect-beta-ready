"use client";

import type { ButtonHTMLAttributes, ReactNode } from "react";

import { cn } from "@/lib/utils";

type ButtonVariant =
  | "primary"
  | "secondary"
  | "ghost"
  | "danger"
  | "filter"
  | "back";

type ButtonDotColor = "blue" | "amber" | "slate";
type ButtonSize = "sm" | "md" | "lg";

type ButtonProps = {
  children: ReactNode;
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  active?: boolean;
  dotColor?: ButtonDotColor;
  className?: string;
} & ButtonHTMLAttributes<HTMLButtonElement>;

const baseStyles =
  "inline-flex items-center justify-center gap-2 font-semibold transition disabled:cursor-not-allowed disabled:opacity-60";

const sizeStyles: Record<ButtonSize, string> = {
  sm: "h-9 px-3.5 text-sm",
  md: "h-10 px-4 text-sm",
  lg: "h-11 px-5 text-base",
};

const variantStyles: Record<Exclude<ButtonVariant, "filter">, string> = {
  primary:
    "rounded-xl border border-blue-600 bg-blue-600 text-white hover:bg-blue-500",
  secondary:
    "rounded-xl border border-white/10 bg-white/10 text-white hover:bg-white/15 backdrop-blur-md",
  ghost:
    "rounded-xl border border-transparent bg-transparent text-slate-200 hover:bg-white/10",
  danger:
    "rounded-xl border border-rose-400/30 bg-rose-500/85 text-white hover:bg-rose-500",
  back:
    "rounded-full border border-white/10 bg-black/70 text-white hover:bg-black/85 backdrop-blur-md",
};

function getFilterDotClass(dotColor: ButtonDotColor): string {
  if (dotColor === "blue") return "bg-blue-400";
  if (dotColor === "amber") return "bg-amber-400";

  return "bg-slate-400";
}

function getFilterButtonClass(
  active: boolean,
  dotColor: ButtonDotColor
): string {
  if (active) {
    if (dotColor === "blue") {
      return "rounded-full border border-blue-200/30 bg-blue-400/20 text-blue-100 backdrop-blur-md";
    }

    if (dotColor === "amber") {
      return "rounded-full border border-amber-200/30 bg-amber-400/20 text-amber-100 backdrop-blur-md";
    }

    return "rounded-full border border-white/20 bg-white/20 text-white backdrop-blur-md";
  }

  return "rounded-full border border-white/10 bg-white/10 text-slate-300 hover:bg-white/20 hover:text-white backdrop-blur-md";
}

export default function Button({
  children,
  variant = "primary",
  size = "md",
  loading = false,
  active = false,
  dotColor = "slate",
  className,
  disabled,
  ...props
}: ButtonProps) {
  const isDisabled = disabled || loading;

  return (
    <button
      type={props.type ?? "button"}
      disabled={isDisabled}
      className={cn(
        baseStyles,
        sizeStyles[size],
        variant === "filter"
          ? getFilterButtonClass(active, dotColor)
          : variantStyles[variant],
        className
      )}
      {...props}
    >
      {variant === "filter" ? (
        <span
          className={cn("h-2 w-2 rounded-full", getFilterDotClass(dotColor))}
        />
      ) : null}

      {loading ? <span className="animate-pulse">...</span> : children}
    </button>
  );
}