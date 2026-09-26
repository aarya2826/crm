"use client";

import { useEffect } from "react";
import type { FC } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { FormField, inputClass } from "@/components/common/FormField";
import { Modal } from "@/components/common/Modal";
import {
  STUDENT_STATUSES,
  STUDENT_STATUS_LABELS,
} from "@/constants/students";
import { toDateInputValue } from "@/lib/formatDate";
import { studentFormSchema, type StudentFormValues } from "@/lib/studentSchema";
import type { BatchDto, CourseDto, StudentDto } from "@/types/academic.types";

interface StudentFormModalProps {
  isOpen: boolean;
  student: StudentDto | null;
  courses: CourseDto[];
  batches: BatchDto[];
  isSubmitting: boolean;
  error: string | null;
  onClose: () => void;
  onSubmit: (values: StudentFormValues) => Promise<void>;
}

export const StudentFormModal: FC<StudentFormModalProps> = ({
  isOpen,
  student,
  courses,
  batches,
  isSubmitting,
  error,
  onClose,
  onSubmit,
}) => {
  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm<StudentFormValues>({
    resolver: zodResolver(studentFormSchema),
    defaultValues: {
      name: "",
      phone: "",
      email: "",
      courseId: "",
      batchId: "",
      enrollmentDate: toDateInputValue(),
      status: "ACTIVE",
    },
  });

  const selectedCourseId = watch("courseId");
  const selectedBatchId = watch("batchId");
  const filteredBatches = batches.filter(
    (batch) => batch.courseId === selectedCourseId
  );

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    reset(
      student
        ? {
            name: student.name,
            phone: student.phone,
            email: student.email ?? "",
            courseId: student.courseId,
            batchId: student.batchId,
            enrollmentDate: toDateInputValue(student.enrollmentDate),
            status: student.status,
          }
        : {
            name: "",
            phone: "",
            email: "",
            courseId: courses[0]?.id ?? "",
            batchId: "",
            enrollmentDate: toDateInputValue(),
            status: "ACTIVE",
          }
    );
  }, [isOpen, student, courses, reset]);

  useEffect(() => {
    if (!selectedCourseId) {
      return;
    }

    const options = batches.filter((batch) => batch.courseId === selectedCourseId);
    const stillValid = options.some((batch) => batch.id === selectedBatchId);
    if (!stillValid) {
      setValue("batchId", options[0]?.id ?? "");
    }
  }, [selectedCourseId, selectedBatchId, batches, setValue]);

  return (
    <Modal
      isOpen={isOpen}
      title={student ? "Edit Student" : "Add New Student"}
      onClose={onClose}
    >
      <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
        <FormField label="Name" error={errors.name?.message}>
          <input {...register("name")} className={inputClass} placeholder="Student name" />
        </FormField>
        <FormField label="Phone" error={errors.phone?.message}>
          <input {...register("phone")} className={inputClass} placeholder="Phone number" />
        </FormField>
        <FormField label="Email" error={errors.email?.message}>
          <input {...register("email")} className={inputClass} placeholder="Optional email" />
        </FormField>
        <div className="grid gap-4 sm:grid-cols-2">
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
          <FormField label="Batch" error={errors.batchId?.message}>
            <select {...register("batchId")} className={inputClass}>
              <option value="">Select a batch</option>
              {filteredBatches.map((batch) => (
                <option key={batch.id} value={batch.id}>
                  {batch.name}
                </option>
              ))}
            </select>
          </FormField>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField label="Enrollment Date" error={errors.enrollmentDate?.message}>
            <input type="date" {...register("enrollmentDate")} className={inputClass} />
          </FormField>
          <FormField label="Status" error={errors.status?.message}>
            <select {...register("status")} className={inputClass}>
              {STUDENT_STATUSES.map((status) => (
                <option key={status} value={status}>
                  {STUDENT_STATUS_LABELS[status]}
                </option>
              ))}
            </select>
          </FormField>
        </div>
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
            {isSubmitting ? "Saving..." : "Save Student"}
          </button>
        </div>
      </form>
    </Modal>
  );
};
