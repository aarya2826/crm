"use client";

/** Students list, enroll modal, bulk status, and documents entry points. */

import { useEffect, useState } from "react";
import type { FC } from "react";
import { useRouter } from "next/navigation";
import {
  bulkDeleteStudents,
  bulkUpdateStudentStatus,
  createStudent,
  deleteStudent,
  updateStudent,
} from "@/app/students/actions";
import { BulkBar } from "@/components/common/BulkBar";
import { Button } from "@/components/common/Button";
import { ConfirmDialog } from "@/components/common/ConfirmDialog";
import { Pagination } from "@/components/common/Pagination";
import type { StudentStatusValue } from "@/constants/students";
import { STUDENT_STATUSES, STUDENT_STATUS_LABELS } from "@/constants/students";
import { exportRowsToExcel } from "@/lib/exportExcel";
import { notify } from "@/lib/toast";
import { withTimeout } from "@/lib/withTimeout";
import type { PagedResult } from "@/lib/query";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { useUrlFilters } from "@/hooks/useUrlFilters";
import type { StudentFormValues } from "@/lib/studentSchema";
import type { UserPermissions } from "@/constants/roles";
import type { BatchDto, CourseDto, StudentDto } from "@/types/academic.types";
import { StudentFilters } from "./StudentFilters";
import { StudentFormModal } from "./StudentFormModal";
import { StudentTable } from "./StudentTable";

interface StudentsManagerProps {
  list: PagedResult<StudentDto>;
  search: string;
  courseId: string;
  batchId: string;
  status: "ALL" | StudentStatusValue;
  courses: CourseDto[];
  batches: BatchDto[];
  permissions: UserPermissions;
  openCreate?: boolean;
}

export const StudentsManager: FC<StudentsManagerProps> = ({
  list,
  search: initialSearch,
  courseId,
  batchId,
  status,
  courses,
  batches,
  permissions,
  openCreate = false,
}) => {
  const router = useRouter();
  const { isPending, setFilters } = useUrlFilters();
  const [search, setSearch] = useState(initialSearch);
  const debouncedSearch = useDebouncedValue(search, 300);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [bulkStatus, setBulkStatus] = useState<StudentStatusValue>("ACTIVE");
  const [pendingBulkDelete, setPendingBulkDelete] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<StudentDto | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [pendingDelete, setPendingDelete] = useState<StudentDto | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const totalPages = Math.max(1, Math.ceil(list.total / list.pageSize));

  useEffect(() => {
    if (openCreate && courses.length > 0 && batches.length > 0) {
      setEditingStudent(null);
      setFormError(null);
      setIsModalOpen(true);
    }
  }, [openCreate, courses.length, batches.length]);

  useEffect(() => {
    setSearch(initialSearch);
  }, [initialSearch]);

  useEffect(() => {
    if (debouncedSearch === initialSearch) {
      return;
    }
    setFilters({ q: debouncedSearch, page: 1 });
  }, [debouncedSearch, initialSearch, setFilters]);

  const closeModal = (): void => {
    setIsModalOpen(false);
    setEditingStudent(null);
    setFormError(null);
  };

  const handleSubmit = async (values: StudentFormValues): Promise<void> => {
    setIsSubmitting(true);
    setFormError(null);

    try {
      const result = editingStudent
        ? await updateStudent(editingStudent.id, values)
        : await createStudent(values);

      if (!result.success) {
        setFormError(result.error ?? "Something went wrong.");
        notify.error(result.error ?? "Something went wrong.");
        return;
      }

      notify.success(editingStudent ? "Student updated" : "Student created");
      closeModal();
      router.refresh();
    } catch (error) {
      console.error("Student form submit failed:", error);
      setFormError("Something went wrong. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (): Promise<void> => {
    if (!pendingDelete) {
      return;
    }

    setIsDeleting(true);
    try {
      const result = await deleteStudent(pendingDelete.id);
      if (!result.success) {
        notify.error(result.error ?? "Could not delete student.");
        return;
      }
      notify.success("Student deleted");
      setPendingDelete(null);
      router.refresh();
    } catch (error) {
      console.error("Failed to delete student:", error);
      notify.error("Could not delete student. Please try again.");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <section className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="page-title">Students</h1>
          <p className="body-text mt-1">
            Enroll students into courses and batches.
          </p>
        </div>
        {permissions.canEditStudents ? (
          <button
            type="button"
            onClick={() => {
              setEditingStudent(null);
              setFormError(null);
              setIsModalOpen(true);
            }}
            disabled={courses.length === 0 || batches.length === 0}
            className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-60"
          >
            Add New Student
          </button>
        ) : null}
      </div>
      {permissions.canEditStudents && (courses.length === 0 || batches.length === 0) ? (
        <p className="text-sm text-amber-700">
          Add at least one course and one batch before enrolling students.
        </p>
      ) : null}
      <div className="surface-card p-5">
        <StudentFilters
          search={search}
          courseId={courseId}
          batchId={batchId}
          status={status}
          courses={courses}
          batches={batches}
          onSearchChange={setSearch}
          onCourseChange={(value) => setFilters({ courseId: value, page: 1 })}
          onBatchChange={(value) => setFilters({ batchId: value, page: 1 })}
          onStatusChange={(value) => setFilters({ status: value, page: 1 })}
        />
        <div className={`mt-5 min-h-[28rem] ${isPending ? "table-busy" : "table-ready"}`} aria-busy={isPending}>
          <BulkBar count={selectedIds.length}>
            <select
              value={bulkStatus}
              onChange={(event) => setBulkStatus(event.target.value as StudentStatusValue)}
              className="rounded-lg border border-slate-200 px-2 py-1 text-xs"
            >
              {STUDENT_STATUSES.map((item) => (
                <option key={item} value={item}>
                  {STUDENT_STATUS_LABELS[item]}
                </option>
              ))}
            </select>
            {permissions.canEditStudents ? (
              <button
                type="button"
                className="rounded-md bg-white px-2 py-1 text-xs font-medium text-brand-700"
                onClick={async () => {
                  const result = await bulkUpdateStudentStatus(selectedIds, bulkStatus);
                  if (!result.success) {
                    notify.error(result.error ?? "Could not update.");
                    return;
                  }
                  notify.success("Status updated");
                  setSelectedIds([]);
                  router.refresh();
                }}
              >
                Change status
              </button>
            ) : null}
            <button
              type="button"
              className="rounded-md bg-white px-2 py-1 text-xs font-medium text-slate-700"
              onClick={() => {
                const rows = list.rows
                  .filter((student) => selectedIds.includes(student.id))
                  .map((student) => [
                    student.name,
                    student.phone,
                    student.email ?? "",
                    student.courseName,
                    student.batchName,
                    student.status,
                    student.attendancePercent ?? "",
                  ]);
                void exportRowsToExcel(
                  "students-selected",
                  "Students",
                  ["Name", "Phone", "Email", "Course", "Batch", "Status", "Attendance %"],
                  rows
                );
              }}
            >
              Export Excel
            </button>
            {permissions.canDelete ? (
              <button
                type="button"
                className="rounded-md bg-white px-2 py-1 text-xs font-medium text-red-600"
                onClick={() => setPendingBulkDelete(true)}
              >
                Delete
              </button>
            ) : null}
          </BulkBar>
          <StudentTable
            students={list.rows}
            canEdit={permissions.canEditStudents}
            canDelete={permissions.canDelete}
            sortKey={list.sort}
            direction={list.dir}
            onSort={(column) =>
              setFilters({
                sort: column,
                dir: list.sort === column && list.dir === "asc" ? "desc" : "asc",
                page: 1,
              })
            }
            onAdd={
              permissions.canEditStudents && courses.length > 0 && batches.length > 0
                ? () => {
                    setEditingStudent(null);
                    setFormError(null);
                    setIsModalOpen(true);
                  }
                : undefined
            }
            onEdit={(student) => {
              setEditingStudent(student);
              setFormError(null);
              setIsModalOpen(true);
            }}
            onDelete={setPendingDelete}
            selectedIds={selectedIds}
            onToggle={(id) =>
              setSelectedIds((current) =>
                current.includes(id) ? current.filter((item) => item !== id) : [...current, id]
              )
            }
            onToggleAll={(ids) =>
              setSelectedIds((current) =>
                ids.every((id) => current.includes(id))
                  ? current.filter((id) => !ids.includes(id))
                  : Array.from(new Set([...current, ...ids]))
              )
            }
          />
          <Pagination
            page={list.page}
            totalPages={totalPages}
            onPageChange={(next) => setFilters({ page: next })}
          />
        </div>
      </div>
      <StudentFormModal
        isOpen={isModalOpen}
        student={editingStudent}
        courses={courses}
        batches={batches}
        isSubmitting={isSubmitting}
        error={formError}
        onClose={closeModal}
        onSubmit={handleSubmit}
      />
      <ConfirmDialog
        isOpen={Boolean(pendingDelete)}
        title="Delete student"
        message={`Are you sure you want to delete this student${pendingDelete ? ` "${pendingDelete.name}"` : ""}?`}
        isLoading={isDeleting}
        onCancel={() => setPendingDelete(null)}
        onConfirm={handleDelete}
      />
      <ConfirmDialog
        isOpen={pendingBulkDelete}
        title="Delete selected students"
        message={`Delete ${selectedIds.length} selected student(s)? This cannot be undone.`}
        isLoading={isDeleting}
        onCancel={() => setPendingBulkDelete(false)}
        onConfirm={async () => {
          setIsDeleting(true);
          try {
            const result = await bulkDeleteStudents(selectedIds);
            if (!result.success) {
              notify.error(result.error ?? "Could not delete.");
              return;
            }
            notify.success("Students deleted");
            setPendingBulkDelete(false);
            setSelectedIds([]);
            router.refresh();
          } finally {
            setIsDeleting(false);
          }
        }}
      />
    </section>
  );
};
