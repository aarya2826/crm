"use client";

import { useState } from "react";
import type { FC } from "react";
import { useRouter } from "next/navigation";
import { createBatch, deleteBatch, updateBatch } from "@/app/batches/actions";
import { ConfirmDialog } from "@/components/common/ConfirmDialog";
import { EmptyState } from "@/components/common/EmptyState";
import { Pagination } from "@/components/common/Pagination";
import { formatDate } from "@/lib/formatDate";
import { paginate } from "@/lib/paginate";
import type { BatchFormValues } from "@/lib/batchSchema";
import type { BatchDto, CourseDto } from "@/types/academic.types";
import { notify } from "@/lib/toast";
import { BatchFormModal } from "./BatchFormModal";

interface BatchesManagerProps {
  initialBatches: BatchDto[];
  courses: CourseDto[];
}

export const BatchesManager: FC<BatchesManagerProps> = ({
  initialBatches,
  courses,
}) => {
  const router = useRouter();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBatch, setEditingBatch] = useState<BatchDto | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [pendingDelete, setPendingDelete] = useState<BatchDto | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const paged = paginate(initialBatches, page);

  const closeModal = (): void => {
    setIsModalOpen(false);
    setEditingBatch(null);
    setFormError(null);
  };

  const handleSubmit = async (values: BatchFormValues): Promise<void> => {
    setIsSubmitting(true);
    setFormError(null);

    try {
      const result = editingBatch
        ? await updateBatch(editingBatch.id, values)
        : await createBatch(values);

      if (!result.success) {
        setFormError(result.error ?? "Something went wrong.");
        notify.error(result.error ?? "Something went wrong.");
        return;
      }

      notify.success(editingBatch ? "Batch updated" : "Batch created");
      closeModal();
      router.refresh();
    } catch (error) {
      console.error("Batch form submit failed:", error);
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
      const result = await deleteBatch(pendingDelete.id);
      if (!result.success) {
        notify.error(result.error ?? "Could not delete batch.");
        return;
      }
      notify.success("Batch deleted");
      setPendingDelete(null);
      router.refresh();
    } catch (error) {
      console.error("Failed to delete batch:", error);
      notify.error("Could not delete batch. Please try again.");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <section className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="page-title">Batches</h1>
          <p className="body-text mt-1">
            Link each batch to a course, then enroll students.
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            setEditingBatch(null);
            setFormError(null);
            setIsModalOpen(true);
          }}
          disabled={courses.length === 0}
          className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-60"
        >
          Add Batch
        </button>
      </div>
      {courses.length === 0 ? (
        <p className="text-sm text-amber-700">Add a course first before creating batches.</p>
      ) : null}
      <div className="surface-card p-5">
        {initialBatches.length === 0 ? (
          <EmptyState message="No batches yet. Add a batch to get started." />
        ) : (
          <>
          <div className="overflow-x-auto rounded-xl border border-slate-200">
            <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
              <thead className="bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-3 py-3">Name</th>
                  <th className="px-3 py-3">Course</th>
                  <th className="px-3 py-3">Start Date</th>
                  <th className="px-3 py-3">Timing</th>
                  <th className="px-3 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {paged.rows.map((batch) => (
                  <tr key={batch.id} className="hover:bg-slate-50">
                    <td className="px-3 py-3 font-medium text-slate-900">{batch.name}</td>
                    <td className="px-3 py-3 text-slate-600">{batch.courseName}</td>
                    <td className="px-3 py-3 text-slate-600">
                      {formatDate(batch.startDate)}
                    </td>
                    <td className="px-3 py-3 text-slate-600">{batch.timing}</td>
                    <td className="px-3 py-3">
                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            setEditingBatch(batch);
                            setFormError(null);
                            setIsModalOpen(true);
                          }}
                          className="rounded-md px-2.5 py-1.5 text-xs font-medium text-brand-700 hover:bg-brand-50"
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => setPendingDelete(batch)}
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
      <BatchFormModal
        isOpen={isModalOpen}
        batch={editingBatch}
        courses={courses}
        isSubmitting={isSubmitting}
        error={formError}
        onClose={closeModal}
        onSubmit={handleSubmit}
      />
      <ConfirmDialog
        isOpen={Boolean(pendingDelete)}
        title="Delete batch"
        message={`Are you sure you want to delete this batch${pendingDelete ? ` "${pendingDelete.name}"` : ""}?`}
        isLoading={isDeleting}
        onCancel={() => setPendingDelete(null)}
        onConfirm={handleDelete}
      />
    </section>
  );
};
