"use client";

import { useState } from "react";
import type { FC } from "react";
import { useRouter } from "next/navigation";
import {
  createCourse,
  deleteCourse,
  updateCourse,
} from "@/app/courses/actions";
import { ConfirmDialog } from "@/components/common/ConfirmDialog";
import { EmptyState } from "@/components/common/EmptyState";
import { Pagination } from "@/components/common/Pagination";
import { formatDate } from "@/lib/formatDate";
import { paginate } from "@/lib/paginate";
import type { CourseFormValues } from "@/lib/courseSchema";
import type { CourseDto } from "@/types/academic.types";
import { notify } from "@/lib/toast";
import { CourseFormModal } from "./CourseFormModal";

interface CoursesManagerProps {
  initialCourses: CourseDto[];
}

export const CoursesManager: FC<CoursesManagerProps> = ({ initialCourses }) => {
  const router = useRouter();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCourse, setEditingCourse] = useState<CourseDto | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [pendingDelete, setPendingDelete] = useState<CourseDto | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const paged = paginate(initialCourses, page);

  const closeModal = (): void => {
    setIsModalOpen(false);
    setEditingCourse(null);
    setFormError(null);
  };

  const handleSubmit = async (values: CourseFormValues): Promise<void> => {
    setIsSubmitting(true);
    setFormError(null);

    try {
      const result = editingCourse
        ? await updateCourse(editingCourse.id, values)
        : await createCourse(values);

      if (!result.success) {
        setFormError(result.error ?? "Something went wrong.");
        notify.error(result.error ?? "Something went wrong.");
        return;
      }

      notify.success(editingCourse ? "Course updated" : "Course created");
      closeModal();
      router.refresh();
    } catch (error) {
      console.error("Course form submit failed:", error);
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
      const result = await deleteCourse(pendingDelete.id);
      if (!result.success) {
        notify.error(result.error ?? "Could not delete course.");
        return;
      }
      notify.success("Course deleted");
      setPendingDelete(null);
      router.refresh();
    } catch (error) {
      console.error("Failed to delete course:", error);
      notify.error("Could not delete course. Please try again.");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <section className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="page-title">Courses</h1>
          <p className="body-text mt-1">
            Add courses before creating batches and students.
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            setEditingCourse(null);
            setFormError(null);
            setIsModalOpen(true);
          }}
          className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700"
        >
          Add Course
        </button>
      </div>
      <div className="surface-card p-5">
        {initialCourses.length === 0 ? (
          <EmptyState message="No courses yet. Add a course to get started." />
        ) : (
          <>
          <div className="overflow-x-auto rounded-xl border border-slate-200">
            <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
              <thead className="bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-3 py-3">Name</th>
                  <th className="px-3 py-3">Duration</th>
                  <th className="px-3 py-3">Total Fee</th>
                  <th className="px-3 py-3">Created</th>
                  <th className="px-3 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {paged.rows.map((course) => (
                  <tr key={course.id} className="hover:bg-slate-50">
                    <td className="px-3 py-3 font-medium text-slate-900">
                      {course.name}
                    </td>
                    <td className="px-3 py-3 text-slate-600">{course.duration}</td>
                    <td className="px-3 py-3 text-slate-600">
                      ₹{course.totalFee.toLocaleString("en-IN")}
                    </td>
                    <td className="px-3 py-3 text-slate-600">
                      {formatDate(course.createdAt)}
                    </td>
                    <td className="px-3 py-3">
                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            setEditingCourse(course);
                            setFormError(null);
                            setIsModalOpen(true);
                          }}
                          className="rounded-md px-2.5 py-1.5 text-xs font-medium text-brand-700 hover:bg-brand-50"
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => setPendingDelete(course)}
                          className="rounded-md px-2.5 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Pagination
            page={paged.current}
            totalPages={paged.totalPages}
            onPageChange={setPage}
          />
          </>
        )}
      </div>
      <CourseFormModal
        isOpen={isModalOpen}
        course={editingCourse}
        isSubmitting={isSubmitting}
        error={formError}
        onClose={closeModal}
        onSubmit={handleSubmit}
      />
      <ConfirmDialog
        isOpen={Boolean(pendingDelete)}
        title="Delete course"
        message={`Are you sure you want to delete this course${pendingDelete ? ` "${pendingDelete.name}"` : ""}?`}
        isLoading={isDeleting}
        onCancel={() => setPendingDelete(null)}
        onConfirm={handleDelete}
      />
    </section>
  );
};
