"use client";

import type { FC } from "react";
import { usePresence } from "@/hooks/usePresence";
import { Spinner } from "./Spinner";

interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  isLoading?: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}

export const ConfirmDialog: FC<ConfirmDialogProps> = ({
  isOpen,
  title,
  message,
  confirmLabel = "Delete",
  isLoading = false,
  onCancel,
  onConfirm,
}) => {
  const { shown, leaving } = usePresence(isOpen);
  if (!shown) {
    return null;
  }

  const leavingClass = leaving ? " is-leaving" : "";

  return (
    <div
      className={`modal-backdrop fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/40 p-4${leavingClass}`}
      onClick={isLoading ? undefined : onCancel}
    >
      <div
        className={`modal-panel w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl dark:bg-slate-900${leavingClass}`}
        onClick={(event) => event.stopPropagation()}
      >
        <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">{title}</h2>
        <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">{message}</p>
        <div className="mt-6 flex justify-end gap-3">
          <button
            type="button"
            onClick={onCancel}
            disabled={isLoading}
            className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 active:bg-slate-100 disabled:opacity-60 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={isLoading}
            onClick={onConfirm}
            className="inline-flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 active:bg-red-800 disabled:opacity-60"
          >
            {isLoading ? <Spinner /> : null}
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
};
