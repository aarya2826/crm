import type { FC } from "react";
import { SearchField } from "@/components/common/SearchField";
import { inputClass } from "@/components/common/FormField";
import { LEAD_STATUSES, STATUS_LABELS } from "@/constants/leads";
import type { LeadStatusValue } from "@/constants/leads";
import type { ScoreBand } from "@/lib/leadScore";

interface LeadFiltersProps {
  search: string;
  status: "ALL" | LeadStatusValue;
  score: "ALL" | ScoreBand;
  onSearchChange: (value: string) => void;
  onStatusChange: (value: "ALL" | LeadStatusValue) => void;
  onScoreChange: (value: "ALL" | ScoreBand) => void;
}

export const LeadFilters: FC<LeadFiltersProps> = ({
  search,
  status,
  score,
  onSearchChange,
  onStatusChange,
  onScoreChange,
}) => {
  return (
    <div className="flex flex-col gap-3 sm:flex-row">
      <label className="sr-only" htmlFor="lead-search">
        Search leads
      </label>
      <SearchField
        id="lead-search"
        type="search"
        value={search}
        onChange={(event) => onSearchChange(event.target.value)}
        placeholder="Search by name or phone"
        aria-label="Search leads"
        className="sm:max-w-sm"
      />
      <label className="sr-only" htmlFor="lead-status-filter">
        Filter by status
      </label>
      <select
        id="lead-status-filter"
        value={status}
        onChange={(event) =>
          onStatusChange(event.target.value as "ALL" | LeadStatusValue)
        }
        className={`${inputClass} sm:w-48`}
      >
        <option value="ALL">All statuses</option>
        {LEAD_STATUSES.map((item) => (
          <option key={item} value={item}>
            {STATUS_LABELS[item]}
          </option>
        ))}
      </select>
      <select
        value={score}
        onChange={(event) => onScoreChange(event.target.value as "ALL" | ScoreBand)}
        className={`${inputClass} sm:w-40`}
      >
        <option value="ALL">All scores</option>
        <option value="HOT">Hot</option>
        <option value="WARM">Warm</option>
        <option value="COLD">Cold</option>
      </select>
    </div>
  );
};
