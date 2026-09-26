"use client";

import { useEffect, useState } from "react";
import type { FC } from "react";
import type { AttendanceStatus } from "@prisma/client";
import { notify } from "@/lib/toast";
import { getAttendanceSheet, saveAttendance } from "@/app/attendance/actions";
import type { AttendanceRow } from "@/app/attendance/actions";
import { EmptyState } from "@/components/common/EmptyState";
import { toDateInputValue } from "@/lib/formatDate";
import type { BatchDto } from "@/types/academic.types";

interface AttendanceManagerProps {
  batches: BatchDto[];
}

const STATUSES: AttendanceStatus[] = ["PRESENT", "ABSENT", "LATE"];

export const AttendanceManager: FC<AttendanceManagerProps> = ({ batches }) => {
  const [batchId, setBatchId] = useState(batches[0]?.id ?? "");
  const [dateValue, setDateValue] = useState(toDateInputValue());
  const [rows, setRows] = useState<AttendanceRow[]>([]);
  const [draft, setDraft] = useState<Record<string, AttendanceStatus | null>>({});
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const loadSheet = async (): Promise<void> => {
    if (!batchId) {
      setRows([]);
      return;
    }
    setLoading(true);
    try {
      const next = await getAttendanceSheet(batchId, dateValue);
      setRows(next);
      const nextDraft: Record<string, AttendanceStatus | null> = {};
      next.forEach((row) => {
        nextDraft[row.studentId] = row.status;
      });
      setDraft(nextDraft);
    } catch (error) {
      console.error(error);
      notify.error("Could not load attendance.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadSheet();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [batchId, dateValue]);

  const handleSave = async (): Promise<void> => {
    const marks = Object.entries(draft)
      .filter((entry): entry is [string, AttendanceStatus] => Boolean(entry[1]))
      .map(([studentId, status]) => ({ studentId, status }));
    if (marks.length === 0) {
      notify.error("Mark at least one student before saving.");
      return;
    }
    setSaving(true);
    try {
      const result = await saveAttendance({ batchId, dateValue, marks });
      if (!result.success) {
        notify.error(result.error ?? "Could not save attendance.");
        return;
      }
      notify.success("Attendance saved");
      await loadSheet();
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="space-y-6">
      <div>
        <h1 className="page-title">Attendance</h1>
        <p className="body-text mt-1">Pick a batch and date, then save the register.</p>
      </div>
      <div className="grid gap-3 surface-card p-5 sm:grid-cols-3">
        <label className="text-sm">
          Batch
          <select value={batchId} onChange={(event) => setBatchId(event.target.value)} className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm">
            {batches.length === 0 ? <option value="">No batches</option> : null}
            {batches.map((batch) => (
              <option key={batch.id} value={batch.id}>
                {batch.name}
              </option>
            ))}
          </select>
        </label>
        <label className="text-sm">
          Date
          <input type="date" value={dateValue} onChange={(event) => setDateValue(event.target.value)} className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" />
        </label>
        <div className="flex items-end">
          <button type="button" disabled={saving || rows.length === 0} onClick={handleSave} className="w-full rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-60">
            {saving ? "Saving…" : "Save Attendance"}
          </button>
        </div>
      </div>
      <div className="surface-card p-5">
        {loading ? (
          <p className="text-sm text-slate-500">Loading register…</p>
        ) : rows.length === 0 ? (
          <EmptyState message="Select a batch with active students to mark attendance." />
        ) : (
          <div className="overflow-x-auto rounded-xl border border-slate-200">
            <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
              <thead className="bg-slate-50 text-xs font-semibold uppercase text-slate-500">
                <tr>
                  <th className="px-3 py-3">Student</th>
                  <th className="px-3 py-3">Current</th>
                  <th className="px-3 py-3 text-right">Mark</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {rows.map((row) => (
                  <tr key={row.studentId} className="hover:bg-slate-50">
                    <td className="px-3 py-3 font-medium">{row.studentName}</td>
                    <td className="px-3 py-3 text-slate-500">{draft[row.studentId] ?? "Not marked"}</td>
                    <td className="px-3 py-3">
                      <div className="flex justify-end gap-2">
                        {STATUSES.map((status) => (
                          <button
                            key={status}
                            type="button"
                            onClick={() => setDraft((current) => ({ ...current, [row.studentId]: status }))}
                            className={`rounded-md px-2.5 py-1.5 text-xs font-medium ${
                              draft[row.studentId] === status ? "bg-brand-600 text-white" : "text-slate-700 hover:bg-slate-100"
                            }`}
                          >
                            {status === "PRESENT" ? "Present" : status === "ABSENT" ? "Absent" : "Late"}
                          </button>
                        ))}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </section>
  );
};
