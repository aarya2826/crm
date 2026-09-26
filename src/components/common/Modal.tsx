"use client";

import { useEffect, useRef } from "react";
import type { FC, ReactNode } from "react";
import { usePresence } from "@/hooks/usePresence";

interface ModalProps {
  isOpen: boolean;
  title: string;
  onClose: () => void;
  children: ReactNode;
  wide?: boolean;
}

export const Modal: FC<ModalProps> = ({
  isOpen,
  title,
  onClose,
  children,
  wide = false,
}) => {
  const panelRef = useRef<HTMLDivElement>(null);
  const { shown, leaving } = usePresence(isOpen);

  useEffect(() => {
    if (!isOpen) {
      return;
    }
    const first = panelRef.current?.querySelector<HTMLElement>(
      "input:not([type='hidden']), select, textarea"
    );
    first?.focus();
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }
    const onKey = (event: KeyboardEvent): void => {
      if (event.key === "Escape") {
        onClose();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isOpen, onClose]);

  if (!shown) {
    return null;
  }

  const leavingClass = leaving ? " is-leaving" : "";

  return (
    <div
      className={`modal-backdrop fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4${leavingClass}`}
      onClick={onClose}
    >
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        className={`modal-panel w-full rounded-2xl bg-white p-6 shadow-xl dark:bg-slate-900 ${wide ? "max-w-3xl" : "max-w-lg"}${leavingClass}`}
        onClick={(event) => event.stopPropagation()}
      >
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md px-2 py-1 text-sm text-slate-500 hover:bg-slate-100 active:bg-slate-200 dark:hover:bg-slate-800"
          >
            Close
          </button>
        </div>
        {children}
      </div>
    </div>
  );
};
