"use client";

import { TriangleAlert, Info, CheckCircle, AlertTriangle } from "lucide-react";

type AlertVariant = "error" | "warning" | "info" | "success";

type AlertProps = {
  message: string;
  variant?: AlertVariant;
  className?: string;
};

const variantStyles: Record<AlertVariant, string> = {
  error:
    "border-red-400/20 bg-red-500/10 text-red-100 shadow-[0_20px_50px_rgba(0,0,0,0.28)]",
  warning:
    "border-amber-400/20 bg-amber-500/10 text-amber-100 shadow-[0_20px_50px_rgba(0,0,0,0.28)]",
  info:
    "border-blue-400/20 bg-blue-500/10 text-blue-100 shadow-[0_20px_50px_rgba(0,0,0,0.28)]",
  success:
    "border-emerald-400/20 bg-emerald-500/10 text-emerald-100 shadow-[0_20px_50px_rgba(0,0,0,0.28)]",
};

const iconMap: Record<AlertVariant, React.ReactNode> = {
  error: <TriangleAlert className="h-4 w-4" />,
  warning: <AlertTriangle className="h-4 w-4" />,
  info: <Info className="h-4 w-4" />,
  success: <CheckCircle className="h-4 w-4" />,
};

const iconWrapperStyles: Record<AlertVariant, string> = {
  error: "bg-red-500/20 text-red-200",
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
    <div
      className={`flex items-start gap-3 rounded-[28px] border p-4 text-sm backdrop-blur-xl ${variantStyles[variant]} ${
        className ?? ""
      }`}
    >
      <span
        className={`mt-0.5 flex h-8 w-8 items-center justify-center rounded-xl ${iconWrapperStyles[variant]}`}
      >
        {iconMap[variant]}
      </span>

      <div className="font-medium">{message}</div>
    </div>
  );
}