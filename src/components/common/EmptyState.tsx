import type { FC } from "react";
import { Inbox } from "lucide-react";
import { Button } from "./Button";

interface EmptyStateProps {
  message: string;
  actionLabel?: string;
  onAction?: () => void;
}

export const EmptyState: FC<EmptyStateProps> = ({ message, actionLabel, onAction }) => {
  return (
    <div className="rounded-xl border border-dashed border-slate-200 bg-white/70 px-6 py-12 text-center dark:border-slate-700 dark:bg-slate-900/50">
      <svg className="mx-auto h-16 w-16 text-brand-200" viewBox="0 0 64 64" fill="none" aria-hidden>
        <rect x="8" y="14" width="48" height="36" rx="8" stroke="currentColor" strokeWidth="2" />
        <path d="M8 22h48" stroke="currentColor" strokeWidth="2" />
        <circle cx="20" cy="34" r="3" fill="currentColor" />
        <path d="M28 34h20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        <path d="M28 40h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      </svg>
      <Inbox className="sr-only" />
      <p className="body-text mt-3">{message}</p>
      {actionLabel && onAction ? (
        <Button type="button" className="mt-4" onClick={onAction}>
          {actionLabel}
        </Button>
      ) : null}
    </div>
  );
};
