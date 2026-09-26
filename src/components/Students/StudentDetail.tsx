"use client";

import { useState } from "react";
import type { FC } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { notify } from "@/lib/toast";
import { createTask } from "@/app/tasks/actions";
import { ActivityTimeline } from "@/components/Activity/ActivityTimeline";
import { LogActivityForm } from "@/components/Activity/LogActivityForm";
import { AttendanceCalendar } from "@/components/Attendance/AttendanceCalendar";
import type { StudentAttendanceView } from "@/app/attendance/actions";
import { StudentDocumentsPanel } from "@/components/Students/StudentDocumentsPanel";
import { SendMessageModal } from "@/components/Messages/SendMessageModal";
import { StudentStatusBadge } from "@/components/Students/StudentStatusBadge";
import type { StudentDocumentDto } from "@/app/documents/actions";
import type { MessageTemplateDto } from "@/app/templates/actions";
import { TaskFormModal } from "@/components/Tasks/TaskFormModal";
import { formatCurrency, formatDate } from "@/lib/formatDate";
import type { TaskFormValues } from "@/lib/taskSchema";
import type { StudentDto } from "@/types/academic.types";
import type { ActivityDto, StaffOption, TaskDto } from "@/types/crm.types";
import type { StudentFeeRow } from "@/types/fee.types";

interface StudentDetailProps {
  student: StudentDto;
  fee: StudentFeeRow | null;
  attendance: StudentAttendanceView;
  activities: ActivityDto[];
  tasks: TaskDto[];
  staff: StaffOption[];
  currentUserId: string;
  canViewFees: boolean;
  documents: StudentDocumentDto[];
  templates: MessageTemplateDto[];
  canEditDocuments: boolean;
}

export const StudentDetail: FC<StudentDetailProps> = ({
  student,
  fee,
  attendance,
  activities,
  tasks,
  staff,
  currentUserId,
  canViewFees,
  documents,
  templates,
  canEditDocuments,
}) => {
  const router = useRouter();
  const [taskOpen, setTaskOpen] = useState(false);
  const [messageOpen, setMessageOpen] = useState(false);
  const [tab, setTab] = useState<"overview" | "documents">("overview");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const handleTask = async (values: TaskFormValues): Promise<void> => {
    setIsSubmitting(true);
    setFormError(null);
    try {
      const result = await createTask({ ...values, relatedStudentId: student.id });
      if (!result.success) {
        setFormError(result.error ?? "Could not create task.");
        notify.error(result.error ?? "Could not create task.");
        return;
      }
      notify.success("Task created");
      setTaskOpen(false);
      router.refresh();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <Link href="/students" className="text-xs font-medium text-brand-600 hover:underline">
            Back to students
          </Link>
          <h1 className="mt-2 text-2xl font-semibold text-slate-900">{student.name}</h1>
          <p className="mt-1 text-sm text-slate-500">
            {student.phone}
            {student.email ? ` · ${student.email}` : ""}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setMessageOpen(true)}
            className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            Send Message
          </button>
          <button
            type="button"
            onClick={() => setTaskOpen(true)}
            className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            Add Follow-up Task
          </button>
        </div>
      </div>
      <div className="flex gap-2 border-b border-slate-200">
        <button
          type="button"
          onClick={() => setTab("overview")}
          className={`border-b-2 px-3 py-2 text-sm font-medium ${tab === "overview" ? "border-brand-600 text-brand-700" : "border-transparent text-slate-500"}`}
        >
          Overview
        </button>
        <button
          type="button"
          onClick={() => setTab("documents")}
          className={`border-b-2 px-3 py-2 text-sm font-medium ${tab === "documents" ? "border-brand-600 text-brand-700" : "border-transparent text-slate-500"}`}
        >
          Documents
        </button>
      </div>
      {tab === "documents" ? (
        <StudentDocumentsPanel studentId={student.id} documents={documents} canEdit={canEditDocuments} />
      ) : (
        <>
      <div className="grid gap-6 lg:grid-cols-3">
        <section className="surface-card p-5">
          <h2 className="text-sm font-semibold text-slate-900">Profile</h2>
          <p className="mt-3 text-sm text-slate-600">Course: {student.courseName}</p>
          <p className="text-sm text-slate-600">Batch: {student.batchName}</p>
          <p className="text-sm text-slate-600">Enrolled: {formatDate(student.enrollmentDate)}</p>
          <div className="mt-3">
            <StudentStatusBadge status={student.status} />
          </div>
        </section>
        {canViewFees && fee ? (
          <section className="surface-card p-5">
            <h2 className="text-sm font-semibold text-slate-900">Fee summary</h2>
            <p className="mt-3 text-sm">Paid: {formatCurrency(fee.amountPaid)}</p>
            <p className="text-sm">Pending: {formatCurrency(fee.pendingAmount)}</p>
            <Link href="/fees" className="mt-3 inline-block text-sm font-medium text-brand-600 hover:underline">
              View all payments
            </Link>
          </section>
        ) : (
          <section className="surface-card p-5">
            <h2 className="text-sm font-semibold text-slate-900">Fee summary</h2>
            <p className="mt-3 text-sm text-slate-500">Fee details are limited for your role.</p>
          </section>
        )}
        <AttendanceCalendar view={attendance} />
      </div>
      <section className="surface-card p-5">
        <h2 className="mb-4 text-sm font-semibold text-slate-900">Tasks</h2>
        {tasks.length === 0 ? (
          <p className="text-sm text-slate-500">No follow-up tasks yet.</p>
        ) : (
          <ul className="space-y-2 text-sm">
            {tasks.map((task) => (
              <li key={task.id} className="flex justify-between gap-3">
                <span>{task.title}</span>
                <span className="text-slate-400">{task.status}</span>
              </li>
            ))}
          </ul>
        )}
      </section>
      <div className="grid gap-6 lg:grid-cols-2">
        <section className="surface-card p-5">
          <h2 className="mb-4 text-sm font-semibold text-slate-900">Activity</h2>
          <ActivityTimeline items={activities} />
        </section>
        <LogActivityForm studentId={student.id} />
      </div>
        </>
      )}
      <TaskFormModal
        isOpen={taskOpen}
        staff={staff}
        defaultAssigneeId={currentUserId}
        relatedStudentId={student.id}
        isSubmitting={isSubmitting}
        error={formError}
        onClose={() => setTaskOpen(false)}
        onSubmit={handleTask}
      />
      <SendMessageModal
        isOpen={messageOpen}
        onClose={() => setMessageOpen(false)}
        templates={templates}
        studentId={student.id}
        to={student.phone}
        values={{
          studentName: student.name,
          courseName: student.courseName,
          amount: fee ? formatCurrency(fee.pendingAmount) : "",
          dueDate: fee?.payments[0]?.nextDueDate ? formatDate(fee.payments[0].nextDueDate) : "",
        }}
      />
    </div>
  );
};
