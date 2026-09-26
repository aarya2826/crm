"use client";

import type { FC } from "react";
import { useRouter } from "next/navigation";
import { EmptyState } from "@/components/common/EmptyState";
import { NameAvatar } from "@/components/common/NameAvatar";
import { SortHeader } from "@/components/common/SortHeader";
import type { SortDirection } from "@/hooks/useTableSort";
import { formatDate } from "@/lib/formatDate";
import type { StudentDto } from "@/types/academic.types";
import { StudentStatusBadge } from "./StudentStatusBadge";

interface StudentTableProps {
  students: StudentDto[];
  canEdit: boolean;
  canDelete: boolean;
  sortKey: string;
  direction: SortDirection;
  onSort: (column: string) => void;
  onAdd?: () => void;
  onEdit: (student: StudentDto) => void;
  onDelete: (student: StudentDto) => void;
  selectedIds: string[];
  onToggle: (id: string) => void;
  onToggleAll: (ids: string[]) => void;
}

export const StudentTable: FC<StudentTableProps> = ({
  students,
  canEdit,
  canDelete,
  sortKey,
  direction,
  onSort,
  onAdd,
  onEdit,
  onDelete,
  selectedIds,
  onToggle,
  onToggleAll,
}) => {
  const router = useRouter();

  if (students.length === 0) {
    return (
      <EmptyState
        message="No students found. Add a student or convert a lead."
        actionLabel={onAdd ? "Add New Student" : undefined}
        onAction={onAdd}
      />
    );
  }

  const actions = (student: StudentDto) => (
    <div className="flex flex-wrap justify-end gap-2">
      {canEdit ? (
        <button type="button" onClick={() => onEdit(student)} className="rounded-md px-2.5 py-1.5 text-xs font-medium text-brand-700 hover:bg-brand-50">
          Edit
        </button>
      ) : null}
      {canDelete ? (
        <button type="button" onClick={() => onDelete(student)} className="rounded-md px-2.5 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50">
          Delete
        </button>
      ) : null}
    </div>
  );

  return (
    <>
      <div className="space-y-3 md:hidden">
        {students.map((student) => (
          <article key={student.id} className="surface-card p-4">
            <label className="mb-2 flex items-center gap-2 text-xs text-slate-500">
              <input type="checkbox" checked={selectedIds.includes(student.id)} onChange={() => onToggle(student.id)} />
              Select
            </label>
            <button type="button" className="flex w-full items-start gap-3 text-left" onClick={() => router.push(`/students/${student.id}`)}>
              <NameAvatar name={student.name} />
              <span>
              <p className="font-medium text-slate-900 dark:text-slate-100">{student.name}</p>
              <p className="mt-1 text-sm text-slate-500">
                {student.phone} · {student.courseName}
                {student.attendancePercent === null ? "" : ` · ${student.attendancePercent}%`}
              </p>
              <div className="mt-2">
                <StudentStatusBadge status={student.status} />
              </div>
              </span>
            </button>
            <div className="mt-3">{actions(student)}</div>
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
                  checked={students.length > 0 && students.every((student) => selectedIds.includes(student.id))}
                  onChange={() => onToggleAll(students.map((student) => student.id))}
                />
              </th>
              <SortHeader label="Name" column="name" sortKey={sortKey} direction={direction} onSort={onSort} />
              <SortHeader label="Phone" column="phone" sortKey={sortKey} direction={direction} onSort={onSort} />
              <SortHeader label="Course" column="courseName" sortKey={sortKey} direction={direction} onSort={onSort} />
              <SortHeader label="Batch" column="batchName" sortKey={sortKey} direction={direction} onSort={onSort} />
              <SortHeader label="Status" column="status" sortKey={sortKey} direction={direction} onSort={onSort} />
              <SortHeader label="Enrolled" column="enrollmentDate" sortKey={sortKey} direction={direction} onSort={onSort} />
              <SortHeader label="Attendance %" column="attendancePercent" sortKey={sortKey} direction={direction} onSort={onSort} />
              <th className="px-3 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {students.map((student) => {
              const selected = selectedIds.includes(student.id);
              return (
              <tr
                key={student.id}
                className={`cursor-pointer odd:bg-white even:bg-slate-50/70 hover:bg-brand-50/70 dark:odd:bg-slate-900 dark:even:bg-slate-950 ${selected ? "bg-brand-50" : ""}`}
                onClick={() => router.push(`/students/${student.id}`)}
              >
                <td className="px-3 py-3.5" onClick={(event) => event.stopPropagation()}>
                  <input type="checkbox" className="h-4 w-4 rounded border-slate-300 text-brand-600" checked={selected} onChange={() => onToggle(student.id)} />
                </td>
                <td className="px-3 py-3.5">
                  <span className="flex items-center gap-2 font-medium text-slate-900 dark:text-slate-100">
                    <NameAvatar name={student.name} />
                    {student.name}
                  </span>
                </td>
                <td className="whitespace-nowrap px-3 py-3.5 text-slate-600">{student.phone}</td>
                <td className="px-3 py-3.5 text-slate-600">{student.courseName}</td>
                <td className="px-3 py-3.5 text-slate-600">{student.batchName}</td>
                <td className="px-3 py-3.5">
                  <StudentStatusBadge status={student.status} />
                </td>
                <td className="whitespace-nowrap px-3 py-3.5 text-slate-600">{formatDate(student.enrollmentDate)}</td>
                <td className="px-3 py-3.5 text-right text-slate-600">
                  {student.attendancePercent === null ? "—" : `${student.attendancePercent}%`}
                </td>
                <td className="px-3 py-3.5" onClick={(event) => event.stopPropagation()}>
                  {actions(student)}
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
