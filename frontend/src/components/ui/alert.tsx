"use client";

import { TriangleAlert, Info, CheckCircle, AlertTriangle } from "lucide-react";

import { cn } from "@/lib/utils";

type AlertVariant = "error" | "warning" | "info" | "success";

type AlertProps = {
  message: string;
  variant?: AlertVariant;
  className?: string;
};

const baseStyles =
  "flex items-start gap-3 rounded-2xl border p-4 text-sm backdrop-blur-md";

const variantStyles: Record<AlertVariant, string> = {
  error: "border-rose-400/20 bg-rose-500/10 text-rose-100",
  warning: "border-amber-400/20 bg-amber-500/10 text-amber-100",
  info: "border-blue-400/20 bg-blue-500/10 text-blue-100",
  success: "border-emerald-400/20 bg-emerald-500/10 text-emerald-100",
};

const iconMap: Record<AlertVariant, React.ReactNode> = {
  error: <TriangleAlert className="h-4 w-4" />,
  warning: <AlertTriangle className="h-4 w-4" />,
  info: <Info className="h-4 w-4" />,
  success: <CheckCircle className="h-4 w-4" />,
};

const iconWrapperStyles: Record<AlertVariant, string> = {
  error: "bg-rose-500/20 text-rose-200",
  warning: "bg-amber-500/20 text-amber-200",
  info: "bg-blue-500/20 text-blue-200",
  success: "bg-emerald-500/20 text-emerald-200",
};

export default function Alert({
  message,
  variant = "error",
  className,
}: AlertProps) {
  return (
    <div className={cn(baseStyles, variantStyles[variant], className)}>
      <span
        className={cn(
          "mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl",
          iconWrapperStyles[variant]
        )}
      >
        {iconMap[variant]}
      </span>

      <div className="font-medium">{message}</div>
    </div>
  );
}