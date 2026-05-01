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
  "inline-flex min-w-0 max-w-full select-none items-center justify-center gap-2 text-center font-semibold leading-none transition disabled:cursor-not-allowed disabled:opacity-60 [-webkit-tap-highlight-color:transparent] touch-manipulation focus:outline-none active:scale-[0.99] [&>svg]:h-4 [&>svg]:w-4 [&>svg]:shrink-0";

const sizeStyles: Record<ButtonSize, string> = {
  sm: "min-h-9 px-3.5 py-2 text-sm",
  md: "min-h-10 px-4 py-2.5 text-sm",
  lg: "min-h-11 px-5 py-3 text-base",
};

const variantStyles: Record<Exclude<ButtonVariant, "filter">, string> = {
  primary:
    "rounded-xl border border-blue-500 bg-blue-600 text-white hover:bg-blue-500 active:bg-blue-700",
  secondary:
    "rounded-xl border border-white/10 bg-white/10 text-white backdrop-blur-md hover:bg-white/15 active:bg-white/10",
  ghost:
    "rounded-xl border border-transparent bg-transparent text-slate-200 hover:bg-white/10 active:bg-transparent",
  danger:
    "rounded-xl border border-rose-400/30 bg-rose-500/90 text-white shadow-sm shadow-rose-950/20 hover:bg-rose-500 active:bg-rose-600",
  back:
    "whitespace-nowrap rounded-full border border-white/10 bg-black/70 text-white backdrop-blur-md hover:bg-black/85 active:bg-black/70",
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

  return "rounded-full border border-white/10 bg-white/10 text-slate-300 backdrop-blur-md hover:bg-white/20 hover:text-white";
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
          className={cn(
            "h-2 w-2 shrink-0 rounded-full",
            getFilterDotClass(dotColor)
          )}
        />
      ) : null}

      {loading ? <span className="animate-pulse">...</span> : children}
    </button>
  );
}