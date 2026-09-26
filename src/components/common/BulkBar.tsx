import type { FC, ReactNode } from "react";

interface BulkBarProps {
  count: number;
  children: ReactNode;
}

export const BulkBar: FC<BulkBarProps> = ({ count, children }) => {
  if (count === 0) {
    return null;
  }

  return (
    <div className="mb-4 flex flex-col gap-3 rounded-xl border border-brand-200 bg-brand-50 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
      <p className="text-sm font-medium text-brand-800 dark:text-brand-200">{count} selected</p>
      <div className="flex flex-wrap gap-2">{children}</div>
    </div>
  );
};
