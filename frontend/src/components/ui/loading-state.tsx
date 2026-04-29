import { cn } from "@/lib/utils";

type LoadingStateProps = {
  text?: string;
  className?: string;
};

const baseStyles =
  "rounded-2xl border border-white/10 bg-white/10 p-6 backdrop-blur-md";

export default function LoadingState({
  text = "Se încarcă...",
  className,
}: LoadingStateProps) {
  return (
    <div className={cn(baseStyles, className)}>
      <div className="flex items-center gap-3">
        <div className="h-2.5 w-2.5 animate-pulse rounded-full bg-white" />
        <p className="text-sm font-medium text-slate-200">{text}</p>
      </div>
    </div>
  );
}