"use client";

import { useMemo, useState } from "react";
import type { FC } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { celebrate } from "@/lib/celebrate";
import { Check, ListTodo } from "lucide-react";
import { notify } from "@/lib/toast";
import { withTimeout } from "@/lib/withTimeout";
import { completeTask, createTask } from "@/app/tasks/actions";
import { EmptyState } from "@/components/common/EmptyState";
import { PRIORITY_BADGE, PRIORITY_LABELS } from "@/constants/tasks";
import { formatDate } from "@/lib/formatDate";
import type { TaskFormValues } from "@/lib/taskSchema";
import type { StaffOption, TaskDto } from "@/types/crm.types";
import { TaskFormModal } from "./TaskFormModal";

interface TasksManagerProps {
  tasks: TaskDto[];
  staff: StaffOption[];
  currentUserId: string;
}

function startOfDay(date: Date): number {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
}

export const TasksManager: FC<TasksManagerProps> = ({ tasks, staff, currentUserId }) => {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [completingId, setCompletingId] = useState<string | null>(null);

  const grouped = useMemo(() => {
    const today = startOfDay(new Date());
    const pending = tasks.filter((task) => task.status === "PENDING");
    return {
      overdue: pending.filter((task) => startOfDay(new Date(task.dueDate)) < today),
      today: pending.filter((task) => startOfDay(new Date(task.dueDate)) === today),
      upcoming: pending.filter((task) => startOfDay(new Date(task.dueDate)) > today),
    };
  }, [tasks]);

  const handleCreate = async (values: TaskFormValues): Promise<void> => {
    setIsSubmitting(true);
    setError(null);
    try {
      const result = await withTimeout(createTask(values));
      if (!result.success) {
        setError(result.error ?? "Could not create task.");
        notify.error(result.error ?? "Could not create task.");
        return;
      }
      notify.success("Task created");
      setIsOpen(false);
      router.refresh();
    } catch (createError) {
      const message = createError instanceof Error ? createError.message : "Could not create task.";
      setError(message);
      notify.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDone = async (id: string): Promise<void> => {
    setCompletingId(id);
    try {
      const result = await withTimeout(completeTask(id));
      if (!result.success) {
        notify.error(result.error ?? "Could not complete task.");
        return;
      }
      celebrate();
      notify.success("Task completed");
      router.refresh();
    } catch (doneError) {
      notify.error(doneError instanceof Error ? doneError.message : "Could not complete task.");
    } finally {
      setCompletingId(null);
    }
  };

  const renderGroup = (title: string, rows: TaskDto[]) => (
    <section className="surface-card p-5">
      <h2 className="text-sm font-semibold text-slate-900">
        {title} ({rows.length})
      </h2>
      {rows.length === 0 ? (
        <p className="mt-3 text-sm text-slate-500">Nothing here.</p>
      ) : (
        <ul className="mt-3 space-y-2">
          {rows.map((task) => (
            <li key={task.id} className="flex flex-col gap-3 rounded-xl border border-slate-100 p-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="font-medium text-slate-900">{task.title}</p>
                <p className="mt-1 text-xs text-slate-500">
                  Due {formatDate(task.dueDate)} · {task.assignedToName}
                  {task.relatedLeadName ? ` · Lead: ${task.relatedLeadName}` : ""}
                  {task.relatedStudentName ? ` · Student: ${task.relatedStudentName}` : ""}
                </p>
                <span className={`mt-2 inline-flex rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${PRIORITY_BADGE[task.priority]}`}>
                  {PRIORITY_LABELS[task.priority]}
                </span>
              </div>
              <div className="flex items-center gap-2">
                {task.relatedLeadId ? (
                  <Link href={`/leads/${task.relatedLeadId}`} className="text-xs font-medium text-brand-600 hover:underline">
                    Open
                  </Link>
                ) : null}
                {task.relatedStudentId ? (
                  <Link href={`/students/${task.relatedStudentId}`} className="text-xs font-medium text-brand-600 hover:underline">
                    Open
                  </Link>
                ) : null}
                <button
                  type="button"
                  disabled={completingId === task.id}
                  onClick={() => handleDone(task.id)}
                  className="inline-flex items-center gap-1 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-emerald-700 disabled:opacity-60"
                >
                  <Check className="h-3.5 w-3.5" />
                  Done
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );

  return (
    <section className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="page-title">Tasks</h1>
          <p className="body-text mt-1">Follow-ups assigned to you, grouped by due date.</p>
        </div>
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700"
        >
          New task
        </button>
      </div>
      {tasks.length === 0 ? (
        <EmptyState message="No tasks yet. Create a follow-up from a lead or student, or add one here." />
      ) : (
        <div className="space-y-4">
          {renderGroup("Overdue", grouped.overdue)}
          {renderGroup("Today", grouped.today)}
          {renderGroup("Upcoming", grouped.upcoming)}
        </div>
      )}
      {tasks.length === 0 ? (
        <div className="flex justify-center">
          <ListTodo className="h-10 w-10 text-slate-300" />
        </div>
      ) : null}
      <TaskFormModal
        isOpen={isOpen}
        staff={staff}
        defaultAssigneeId={currentUserId}
        isSubmitting={isSubmitting}
        error={error}
        onClose={() => setIsOpen(false)}
        onSubmit={handleCreate}
      />
    </section>
  );
};
