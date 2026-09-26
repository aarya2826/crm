import type { FC } from "react";

export const TableSkeleton: FC = () => {
  return (
    <div className="min-h-[28rem] space-y-3 rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
      <div className="h-6 w-40 animate-pulse rounded bg-slate-200 dark:bg-slate-700" />
      {Array.from({ length: 6 }).map((_, index) => (
        <div key={index} className="h-10 animate-pulse rounded bg-slate-100 dark:bg-slate-800" />
      ))}
    </div>
  );
};
