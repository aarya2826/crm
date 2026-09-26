import type { FC } from "react";
import type { SortDirection } from "@/hooks/useTableSort";

interface SortHeaderProps {
  label: string;
  column: string;
  sortKey: string;
  direction: SortDirection;
  onSort: (column: string) => void;
  align?: "left" | "right";
}

export const SortHeader: FC<SortHeaderProps> = ({
  label,
  column,
  sortKey,
  direction,
  onSort,
  align = "left",
}) => {
  const active = sortKey === column;
  return (
    <th className={`px-3 py-3 ${align === "right" ? "text-right" : "text-left"}`}>
      <button
        type="button"
        onClick={() => onSort(column)}
        className="inline-flex items-center gap-1 font-semibold uppercase tracking-wide hover:text-slate-800"
      >
        {label}
        <span className="text-[10px] text-slate-400">
          {active ? (direction === "asc" ? "▲" : "▼") : "↕"}
        </span>
      </button>
    </th>
  );
};
