"use client";

import type { ReactNode } from "react";

import AppModal from "@/components/ui/app-modal";
import Button from "@/components/ui/button";

type ConfirmDialogProps = {
  open: boolean;
  title?: string;
  message?: string;
  children?: ReactNode;
  confirmText?: string;
  cancelText?: string;
  loading?: boolean;
  loadingText?: string;
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
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  function handleClose() {
    if (!loading) onCancel();
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

        <div className="flex justify-end gap-2">
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
            variant="danger"
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