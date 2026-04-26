"use client";

type SidebarOverlayProps = {
  open: boolean;
  onClose: () => void;
  ariaLabel?: string;
};

export default function SidebarOverlay({
  open,
  onClose,
  ariaLabel = "Close sidebar overlay",
}: SidebarOverlayProps) {
  if (!open) {
    return null;
  }

  return (
    <button
      type="button"
      onClick={onClose}
      className="fixed inset-0 z-40 bg-slate-950/50 backdrop-blur-[3px] md:hidden"
      aria-label={ariaLabel}
    />
  );
}