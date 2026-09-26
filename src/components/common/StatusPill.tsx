import type { FC } from "react";

interface StatusPillProps {
  label: string;
  className: string;
}

export const StatusPill: FC<StatusPillProps> = ({ label, className }) => {
  return (
    <span
      className={`inline-flex min-h-[1.75rem] items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ring-1 ring-inset ${className}`}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current opacity-80" />
      {label}
    </span>
  );
};
