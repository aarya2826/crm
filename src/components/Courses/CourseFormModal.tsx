"use client";

import { useEffect } from "react";
import type { FC } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { FormField, inputClass } from "@/components/common/FormField";
import { Modal } from "@/components/common/Modal";
import { courseFormSchema, type CourseFormValues } from "@/lib/courseSchema";
import type { CourseDto } from "@/types/academic.types";

interface CourseFormModalProps {
  isOpen: boolean;
  course: CourseDto | null;
  isSubmitting: boolean;
  error: string | null;
  onClose: () => void;
  onSubmit: (values: CourseFormValues) => Promise<void>;
}

const defaultValues: CourseFormValues = {
  name: "",
  duration: "",
  totalFee: 0,
};

export const CourseFormModal: FC<CourseFormModalProps> = ({
  isOpen,
  course,
  isSubmitting,
  error,
  onClose,
  onSubmit,
}) => {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CourseFormValues>({
    resolver: zodResolver(courseFormSchema),
    defaultValues,
  });

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    reset(
      course
        ? {
            name: course.name,
            duration: course.duration,
            totalFee: course.totalFee,
          }
        : defaultValues
    );
  }, [isOpen, course, reset]);

  return (
    <Modal
      isOpen={isOpen}
      title={course ? "Edit Course" : "Add Course"}
      onClose={onClose}
    >
      <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
        <FormField label="Name" error={errors.name?.message}>
          <input {...register("name")} className={inputClass} placeholder="Course name" />
        </FormField>
        <FormField label="Duration" error={errors.duration?.message}>
          <input
            {...register("duration")}
            className={inputClass}
            placeholder="e.g. 3 months"
          />
        </FormField>
        <FormField label="Total Fee" error={errors.totalFee?.message}>
          <input
            type="number"
            min={0}
            {...register("totalFee", { valueAsNumber: true })}
            className={inputClass}
            placeholder="25000"
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
            {isSubmitting ? "Saving..." : "Save Course"}
          </button>
        </div>
      </form>
    </Modal>
  );
};
