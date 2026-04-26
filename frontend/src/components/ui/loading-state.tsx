type LoadingStateProps = {
  text?: string;
  className?: string;
};

export default function LoadingState({
  text = "Se încarcă...",
  className,
}: LoadingStateProps) {
  return (
    <div
      className={`rounded-[28px] border border-white/10 bg-white/10 p-6 shadow-[0_20px_50px_rgba(0,0,0,0.28)] backdrop-blur-xl ${
        className ?? ""
      }`}
    >
      <div className="flex items-center gap-3">
        <div className="h-2.5 w-2.5 rounded-full bg-white animate-pulse" />
        <p className="text-sm font-medium text-slate-200">{text}</p>
      </div>
    </div>
  );
}