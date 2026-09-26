"use client";

import { useEffect } from "react";
import type { FC } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { FormField, inputClass } from "@/components/common/FormField";
import { Modal } from "@/components/common/Modal";
import { TASK_PRIORITIES, PRIORITY_LABELS } from "@/constants/tasks";
import { taskFormSchema } from "@/lib/taskSchema";
import type { TaskFormValues } from "@/lib/taskSchema";
import { toDateInputValue } from "@/lib/formatDate";
import type { StaffOption } from "@/types/crm.types";

interface TaskFormModalProps {
  isOpen: boolean;
  staff: StaffOption[];
  defaultAssigneeId: string;
  relatedLeadId?: string;
  relatedStudentId?: string;
  isSubmitting: boolean;
  error: string | null;
  onClose: () => void;
  onSubmit: (values: TaskFormValues) => Promise<void>;
}

export const TaskFormModal: FC<TaskFormModalProps> = ({
  isOpen,
  staff,
  defaultAssigneeId,
  relatedLeadId,
  relatedStudentId,
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
  } = useForm<TaskFormValues>({
    resolver: zodResolver(taskFormSchema),
    defaultValues: {
      title: "",
      dueDate: toDateInputValue(),
      priority: "MEDIUM",
      assignedToUserId: defaultAssigneeId,
      relatedLeadId,
      relatedStudentId,
    },
  });

  useEffect(() => {
    if (isOpen) {
      reset({
        title: "",
        dueDate: toDateInputValue(),
        priority: "MEDIUM",
        assignedToUserId: defaultAssigneeId,
        relatedLeadId,
        relatedStudentId,
      });
    }
  }, [isOpen, defaultAssigneeId, relatedLeadId, relatedStudentId, reset]);

  return (
    <Modal isOpen={isOpen} title="Add follow-up task" onClose={onClose}>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <FormField label="Title" error={errors.title?.message}>
          <input className={inputClass} {...register("title")} />
        </FormField>
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField label="Due date" error={errors.dueDate?.message}>
            <input type="date" className={inputClass} {...register("dueDate")} />
          </FormField>
          <FormField label="Priority" error={errors.priority?.message}>
            <select className={inputClass} {...register("priority")}>
              {TASK_PRIORITIES.map((priority) => (
                <option key={priority} value={priority}>
                  {PRIORITY_LABELS[priority]}
                </option>
              ))}
            </select>
          </FormField>
        </div>
        <FormField label="Assign to" error={errors.assignedToUserId?.message}>
          <select className={inputClass} {...register("assignedToUserId")}>
            {staff.map((person) => (
              <option key={person.id} value={person.id}>
                {person.name}
              </option>
            ))}
          </select>
        </FormField>
        {error ? <p className="text-sm text-red-600">{error}</p> : null}
        <div className="flex justify-end gap-2">
          <button type="button" onClick={onClose} className="rounded-lg px-4 py-2 text-sm text-slate-600 hover:bg-slate-100">
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-60"
          >
            {isSubmitting ? "Saving…" : "Create task"}
          </button>
        </div>
      </form>
    </Modal>
  );
};
