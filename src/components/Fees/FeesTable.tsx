"use client";

import type { FC } from "react";
import { EmptyState } from "@/components/common/EmptyState";
import { NameAvatar } from "@/components/common/NameAvatar";
import { StatusPill } from "@/components/common/StatusPill";
import { SortHeader } from "@/components/common/SortHeader";
import { FEE_STATUS_BADGE, FEE_STATUS_LABELS } from "@/constants/fees";
import type { SortDirection } from "@/hooks/useTableSort";
import { formatCurrency } from "@/lib/formatDate";
import type { StudentFeeRow } from "@/types/fee.types";

interface FeesTableProps {
  rows: StudentFeeRow[];
  canRecordPayments: boolean;
  sortKey: string;
  direction: SortDirection;
  onSort: (column: string) => void;
  onPay: (row: StudentFeeRow) => void;
  onHistory: (row: StudentFeeRow) => void;
  onRemind?: (row: StudentFeeRow) => void;
}

export const FeesTable: FC<FeesTableProps> = ({
  rows,
  canRecordPayments,
  sortKey,
  direction,
  onSort,
  onPay,
  onHistory,
  onRemind,
}) => {
  if (rows.length === 0) {
    return <EmptyState message="No student fee records found." />;
  }

  const actions = (row: StudentFeeRow) => (
    <div className="flex flex-wrap justify-end gap-2">
      {canRecordPayments ? (
        <button
          type="button"
          onClick={() => onPay(row)}
          className="rounded-md px-2.5 py-1.5 text-xs font-medium text-brand-700 hover:bg-brand-50"
        >
          Record Payment
        </button>
      ) : null}
      <button
        type="button"
        onClick={() => onHistory(row)}
        className="rounded-md px-2.5 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-100"
      >
        History
      </button>
      {onRemind && row.pendingAmount > 0 ? (
        <button
          type="button"
          onClick={() => onRemind(row)}
          className="rounded-md px-2.5 py-1.5 text-xs font-medium text-amber-700 hover:bg-amber-50"
        >
          Send Reminder
        </button>
      ) : null}
    </div>
  );

  return (
    <>
      <div className="space-y-3 md:hidden">
        {rows.map((row) => (
          <article key={row.studentId} className="surface-card p-4">
            <div className="flex items-start gap-3">
              <NameAvatar name={row.studentName} />
              <div>
                <p className="font-medium text-slate-900 dark:text-slate-100">{row.studentName}</p>
                <p className="mt-1 text-sm text-slate-500">{row.courseName}</p>
                <p className="mt-2 text-sm">Pending {formatCurrency(row.pendingAmount)}</p>
                <div className="mt-2">
                  <StatusPill label={FEE_STATUS_LABELS[row.status]} className={FEE_STATUS_BADGE[row.status]} />
                </div>
                <div className="mt-3">{actions(row)}</div>
              </div>
            </div>
          </article>
        ))}
      </div>
      <div className="hidden overflow-x-auto rounded-xl border border-slate-200 md:block dark:border-slate-800">
        <table className="min-w-full text-left text-sm">
          <thead className="sticky top-0 z-10 bg-slate-50/95 text-xs text-slate-500 shadow-header backdrop-blur dark:bg-slate-900/95">
            <tr>
              <SortHeader label="Name" column="studentName" sortKey={sortKey} direction={direction} onSort={onSort} />
              <SortHeader label="Course" column="courseName" sortKey={sortKey} direction={direction} onSort={onSort} />
              <SortHeader label="Total" column="totalFee" sortKey={sortKey} direction={direction} onSort={onSort} />
              <SortHeader label="Paid" column="amountPaid" sortKey={sortKey} direction={direction} onSort={onSort} />
              <SortHeader label="Pending" column="pendingAmount" sortKey={sortKey} direction={direction} onSort={onSort} />
              <SortHeader label="Status" column="status" sortKey={sortKey} direction={direction} onSort={onSort} />
              <th className="px-3 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.studentId} className="odd:bg-white even:bg-slate-50/70 hover:bg-brand-50/70 dark:odd:bg-slate-900 dark:even:bg-slate-950">
                <td className="px-3 py-3.5">
                  <span className="flex items-center gap-2 font-medium text-slate-900 dark:text-slate-100">
                    <NameAvatar name={row.studentName} />
                    {row.studentName}
                  </span>
                </td>
                <td className="px-3 py-3.5 text-slate-600">{row.courseName}</td>
                <td className="px-3 py-3.5 text-right">{formatCurrency(row.totalFee)}</td>
                <td className="px-3 py-3.5 text-right">{formatCurrency(row.amountPaid)}</td>
                <td className="px-3 py-3.5 text-right">{formatCurrency(row.pendingAmount)}</td>
                <td className="px-3 py-3.5">
                  <StatusPill label={FEE_STATUS_LABELS[row.status]} className={FEE_STATUS_BADGE[row.status]} />
                </td>
                <td className="px-3 py-3.5">{actions(row)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
};
