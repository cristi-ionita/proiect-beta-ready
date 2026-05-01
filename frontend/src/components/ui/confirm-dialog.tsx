"use client";

import type { ReactNode } from "react";

import AppModal from "@/components/ui/app-modal";
import Button from "@/components/ui/button";

type ConfirmDialogVariant = "primary" | "danger";

type ConfirmDialogProps = {
  open: boolean;
  title?: string;
  message?: string;
  children?: ReactNode;
  confirmText?: string;
  cancelText?: string;
  loading?: boolean;
  loadingText?: string;
  confirmVariant?: ConfirmDialogVariant;
  onConfirm: () => void;
  onCancel: () => void;
};

export default function ConfirmDialog({
  open,
  title = "Confirmare",
  message,
  children,
  confirmText = "Confirmă",
  cancelText = "Anulează",
  loading = false,
  loadingText = "Se procesează...",
  confirmVariant = "danger",
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  function handleClose() {
    if (loading) return;
    onCancel();
  }

  return (
    <AppModal open={open} onClose={handleClose} title={title}>
      <div className="space-y-5">
        {message ? (
          <p className="whitespace-pre-line text-sm leading-6 text-slate-300">
            {message}
          </p>
        ) : null}

        {children ? <div>{children}</div> : null}

        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button
            type="button"
            variant="secondary"
            onClick={handleClose}
            disabled={loading}
          >
            {cancelText}
          </Button>

          <Button
            type="button"
            variant={confirmVariant === "danger" ? "danger" : "primary"}
            onClick={onConfirm}
            disabled={loading}
            loading={loading}
          >
            {loading ? loadingText : confirmText}
          </Button>
        </div>
      </div>
    </AppModal>
  );
}