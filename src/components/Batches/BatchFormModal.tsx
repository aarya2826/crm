"use client";

import { useEffect } from "react";
import type { FC } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { FormField, inputClass } from "@/components/common/FormField";
import { Modal } from "@/components/common/Modal";
import { batchFormSchema, type BatchFormValues } from "@/lib/batchSchema";
import { toDateInputValue } from "@/lib/formatDate";
import type { BatchDto, CourseDto } from "@/types/academic.types";

interface BatchFormModalProps {
  isOpen: boolean;
  batch: BatchDto | null;
  courses: CourseDto[];
  isSubmitting: boolean;
  error: string | null;
  onClose: () => void;
  onSubmit: (values: BatchFormValues) => Promise<void>;
}

export const BatchFormModal: FC<BatchFormModalProps> = ({
  isOpen,
  batch,
  courses,
  isSubmitting,
  error,
  onClose,
  onSubmit,
}) => {
  const defaultValues: BatchFormValues = {
    name: "",
    courseId: courses[0]?.id ?? "",
    startDate: toDateInputValue(),
    timing: "",
  };

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<BatchFormValues>({
    resolver: zodResolver(batchFormSchema),
    defaultValues,
  });

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    reset(
      batch
        ? {
            name: batch.name,
            courseId: batch.courseId,
            startDate: toDateInputValue(batch.startDate),
            timing: batch.timing,
          }
        : {
            ...defaultValues,
            courseId: courses[0]?.id ?? "",
            startDate: toDateInputValue(),
          }
    );
  }, [isOpen, batch, courses, reset]);

  return (
    <Modal
      isOpen={isOpen}
      title={batch ? "Edit Batch" : "Add Batch"}
      onClose={onClose}
    >
      <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
        <FormField label="Name" error={errors.name?.message}>
          <input {...register("name")} className={inputClass} placeholder="Morning Batch A" />
        </FormField>
        <FormField label="Course" error={errors.courseId?.message}>
          <select {...register("courseId")} className={inputClass}>
            <option value="">Select a course</option>
            {courses.map((course) => (
              <option key={course.id} value={course.id}>
                {course.name}
              </option>
            ))}
          </select>
        </FormField>
        <FormField label="Start Date" error={errors.startDate?.message}>
          <input type="date" {...register("startDate")} className={inputClass} />
        </FormField>
        <FormField label="Timing" error={errors.timing?.message}>
          <input
            {...register("timing")}
            className={inputClass}
            placeholder="e.g. 10:00 AM - 12:00 PM"
          />
        </FormField>
        {error ? <p className="text-sm text-red-600">{error}</p> : null}
        <div className="flex justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-60"
          >
            {isSubmitting ? "Saving..." : "Save Batch"}
          </button>
        </div>
      </form>
    </Modal>
  );
};
