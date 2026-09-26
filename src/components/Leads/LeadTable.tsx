"use client";

import type { FC } from "react";
import { useRouter } from "next/navigation";
import { EmptyState } from "@/components/common/EmptyState";
import { NameAvatar } from "@/components/common/NameAvatar";
import { SortHeader } from "@/components/common/SortHeader";
import { SOURCE_LABELS } from "@/constants/leads";
import type { SortDirection } from "@/hooks/useTableSort";
import { formatDate } from "@/lib/formatDate";
import type { LeadDto } from "@/types/lead.types";
import { ScoreBadge } from "./ScoreBadge";
import { StatusBadge } from "./StatusBadge";

interface LeadTableProps {
  leads: LeadDto[];
  canEdit: boolean;
  canDelete: boolean;
  canConvert: boolean;
  sortKey: string;
  direction: SortDirection;
  onSort: (column: string) => void;
  onAdd?: () => void;
  onEdit: (lead: LeadDto) => void;
  onDelete: (lead: LeadDto) => void;
  onConvert: (lead: LeadDto) => void;
  selectedIds: string[];
  onToggle: (id: string) => void;
  onToggleAll: (ids: string[]) => void;
}

export const LeadTable: FC<LeadTableProps> = ({
  leads,
  canEdit,
  canDelete,
  canConvert,
  sortKey,
  direction,
  onSort,
  onAdd,
  onEdit,
  onDelete,
  onConvert,
  selectedIds,
  onToggle,
  onToggleAll,
}) => {
  const router = useRouter();

  if (leads.length === 0) {
    return (
      <EmptyState
        message="No leads found. Add a new lead to get started."
        actionLabel={onAdd ? "Add New Lead" : undefined}
        onAction={onAdd}
      />
    );
  }

  const actions = (lead: LeadDto) => (
    <div className="flex flex-wrap justify-end gap-2">
      {canConvert && lead.status !== "CONVERTED" ? (
        <button type="button" onClick={() => onConvert(lead)} className="rounded-md px-2.5 py-1.5 text-xs font-medium text-emerald-700 hover:bg-emerald-50">
          Convert
        </button>
      ) : null}
      {canEdit ? (
        <button type="button" onClick={() => onEdit(lead)} className="rounded-md px-2.5 py-1.5 text-xs font-medium text-brand-700 hover:bg-brand-50">
          Edit
        </button>
      ) : null}
      {canDelete ? (
        <button type="button" onClick={() => onDelete(lead)} className="rounded-md px-2.5 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50">
          Delete
        </button>
      ) : null}
    </div>
  );

  return (
    <>
      <div className="space-y-3 md:hidden">
        {leads.map((lead) => (
          <article key={lead.id} className="surface-card p-4">
            <label className="mb-2 flex items-center gap-2 text-xs text-slate-500">
              <input type="checkbox" checked={selectedIds.includes(lead.id)} onChange={() => onToggle(lead.id)} />
              Select
            </label>
            <button type="button" className="flex w-full items-start gap-3 text-left" onClick={() => router.push(`/leads/${lead.id}`)}>
              <NameAvatar name={lead.name} />
              <span>
              <p className="font-medium text-slate-900 dark:text-slate-100">{lead.name}</p>
              <p className="mt-1 text-sm text-slate-500">{lead.phone} · {SOURCE_LABELS[lead.source]}</p>
              <div className="mt-2 flex flex-wrap gap-2">
                <StatusBadge status={lead.status} />
                <ScoreBadge score={lead.score} />
              </div>
              </span>
            </button>
            <div className="mt-3" onClick={(event) => event.stopPropagation()}>
              {actions(lead)}
            </div>
          </article>
        ))}
      </div>
      <div className="hidden overflow-x-auto rounded-xl border border-slate-200 md:block dark:border-slate-800">
        <table className="min-w-full text-left text-sm">
          <thead className="sticky top-0 z-10 bg-slate-50/95 text-xs text-slate-500 shadow-header backdrop-blur dark:bg-slate-900/95">
            <tr>
              <th className="px-3 py-3">
                <input
                  type="checkbox"
                  checked={leads.length > 0 && leads.every((lead) => selectedIds.includes(lead.id))}
                  onChange={() => onToggleAll(leads.map((lead) => lead.id))}
                />
              </th>
              <SortHeader label="Name" column="name" sortKey={sortKey} direction={direction} onSort={onSort} />
              <SortHeader label="Phone" column="phone" sortKey={sortKey} direction={direction} onSort={onSort} />
              <SortHeader label="Course" column="courseInterested" sortKey={sortKey} direction={direction} onSort={onSort} />
              <SortHeader label="Source" column="source" sortKey={sortKey} direction={direction} onSort={onSort} />
              <SortHeader label="Status" column="status" sortKey={sortKey} direction={direction} onSort={onSort} />
              <SortHeader label="Score" column="score" sortKey={sortKey} direction={direction} onSort={onSort} />
              <SortHeader label="Created" column="createdAt" sortKey={sortKey} direction={direction} onSort={onSort} />
              <th className="px-3 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {leads.map((lead) => {
              const selected = selectedIds.includes(lead.id);
              return (
              <tr
                key={lead.id}
                className={`cursor-pointer odd:bg-white even:bg-slate-50/70 hover:bg-brand-50/70 active:bg-brand-50 dark:odd:bg-slate-900 dark:even:bg-slate-950 dark:hover:bg-slate-800 ${selected ? "bg-brand-50 dark:bg-brand-900/20" : ""}`}
                onClick={() => router.push(`/leads/${lead.id}`)}
              >
                <td className="px-3 py-3.5" onClick={(event) => event.stopPropagation()}>
                  <input type="checkbox" className="h-4 w-4 rounded border-slate-300 text-brand-600" checked={selected} onChange={() => onToggle(lead.id)} />
                </td>
                <td className="px-3 py-3.5">
                  <span className="flex items-center gap-2 font-medium text-slate-900 dark:text-slate-100">
                    <NameAvatar name={lead.name} />
                    {lead.name}
                  </span>
                </td>
                <td className="whitespace-nowrap px-3 py-3.5 text-slate-600">{lead.phone}</td>
                <td className="px-3 py-3.5 text-slate-600">{lead.courseInterested || "—"}</td>
                <td className="px-3 py-3.5 text-slate-600">{SOURCE_LABELS[lead.source]}</td>
                <td className="px-3 py-3.5">
                  <StatusBadge status={lead.status} />
                </td>
                <td className="px-3 py-3.5 text-right">
                  <ScoreBadge score={lead.score} />
                </td>
                <td className="whitespace-nowrap px-3 py-3.5 text-slate-600">{formatDate(lead.createdAt)}</td>
                <td className="px-3 py-3.5" onClick={(event) => event.stopPropagation()}>
                  {actions(lead)}
                </td>
              </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </>
  );
};
