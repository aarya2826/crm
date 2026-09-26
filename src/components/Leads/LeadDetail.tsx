"use client";

import { useState } from "react";
import type { FC } from "react";
import { useRouter } from "next/navigation";
import { notify } from "@/lib/toast";
import { assignLeadCounselor, updateLeadStatus } from "@/app/leads/actions";
import { createTask } from "@/app/tasks/actions";
import { ActivityTimeline } from "@/components/Activity/ActivityTimeline";
import { LogActivityForm } from "@/components/Activity/LogActivityForm";
import { ConvertLeadModal } from "@/components/Leads/ConvertLeadModal";
import { ScoreBadge } from "@/components/Leads/ScoreBadge";
import { StatusBadge } from "@/components/Leads/StatusBadge";
import { SendMessageModal } from "@/components/Messages/SendMessageModal";
import type { MessageTemplateDto } from "@/app/templates/actions";
import { TaskFormModal } from "@/components/Tasks/TaskFormModal";
import { LEAD_STATUSES, SOURCE_LABELS, STATUS_LABELS } from "@/constants/leads";
import type { LeadStatusValue } from "@/constants/leads";
import { formatDate } from "@/lib/formatDate";
import type { TaskFormValues } from "@/lib/taskSchema";
import type { ConvertLeadFormValues } from "@/lib/studentSchema";
import { convertLeadToStudent } from "@/app/students/actions";
import type { UserPermissions } from "@/constants/roles";
import type { BatchDto, CourseDto } from "@/types/academic.types";
import type { ActivityDto, StaffOption, TaskDto } from "@/types/crm.types";
import type { LeadDto } from "@/types/lead.types";
import Link from "next/link";

interface LeadDetailProps {
  lead: LeadDto;
  activities: ActivityDto[];
  tasks: TaskDto[];
  staff: StaffOption[];
  currentUserId: string;
  courses: CourseDto[];
  batches: BatchDto[];
  permissions: UserPermissions;
  templates: MessageTemplateDto[];
}

export const LeadDetail: FC<LeadDetailProps> = ({
  lead,
  activities,
  tasks,
  staff,
  currentUserId,
  courses,
  batches,
  permissions,
  templates,
}) => {
  const router = useRouter();
  const [taskOpen, setTaskOpen] = useState(false);
  const [messageOpen, setMessageOpen] = useState(false);
  const [convertOpen, setConvertOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const counselors = staff.filter((person) => person.role === "COUNSELOR" || person.role === "ADMIN");

  const handleStatus = async (status: LeadStatusValue): Promise<void> => {
    const result = await updateLeadStatus(lead.id, status);
    if (!result.success) {
      notify.error(result.error ?? "Could not update status.");
      return;
    }
    notify.success("Status updated");
    router.refresh();
  };

  const handleAssign = async (assignedCounselorId: string): Promise<void> => {
    const result = await assignLeadCounselor(lead.id, assignedCounselorId || null);
    if (!result.success) {
      notify.error(result.error ?? "Could not assign counselor.");
      return;
    }
    notify.success("Counselor assigned");
    router.refresh();
  };

  const handleTask = async (values: TaskFormValues): Promise<void> => {
    setIsSubmitting(true);
    setFormError(null);
    try {
      const result = await createTask({ ...values, relatedLeadId: lead.id });
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

  const handleConvert = async (values: ConvertLeadFormValues): Promise<void> => {
    setIsSubmitting(true);
    setFormError(null);
    try {
      const result = await convertLeadToStudent(lead.id, values);
      if (!result.success) {
        setFormError(result.error ?? "Could not convert lead.");
        notify.error(result.error ?? "Could not convert lead.");
        return;
      }
      notify.success("Lead converted to student");
      setConvertOpen(false);
      router.refresh();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <Link href="/leads" className="text-xs font-medium text-brand-600 hover:underline">
            Back to leads
          </Link>
          <h1 className="mt-2 text-2xl font-semibold text-slate-900">{lead.name}</h1>
          <div className="mt-2">
            <ScoreBadge score={lead.score} />
          </div>
          <p className="mt-1 text-sm text-slate-500">
            {lead.phone}
            {lead.email ? ` · ${lead.email}` : ""}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {permissions.canEditStudents && lead.status !== "CONVERTED" ? (
            <button
              type="button"
              onClick={() => setConvertOpen(true)}
              className="rounded-lg bg-emerald-600 px-3 py-2 text-sm font-medium text-white hover:bg-emerald-700"
            >
              Convert to Student
            </button>
          ) : null}
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
      <div className="grid gap-6 lg:grid-cols-3">
        <section className="space-y-4 surface-card p-5 lg:col-span-1">
          <h2 className="text-sm font-semibold text-slate-900">Profile</h2>
          <p className="text-sm text-slate-600">Source: {SOURCE_LABELS[lead.source]}</p>
          <p className="text-sm text-slate-600">Course: {lead.courseInterested || "—"}</p>
          <p className="text-sm text-slate-600">Created: {formatDate(lead.createdAt)}</p>
          <div>
            <p className="mb-2 text-xs font-medium uppercase text-slate-500">Status</p>
            {permissions.canEditLeads ? (
              <select
                value={lead.status}
                onChange={(event) => handleStatus(event.target.value as LeadStatusValue)}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
              >
                {LEAD_STATUSES.map((status) => (
                  <option key={status} value={status}>
                    {STATUS_LABELS[status]}
                  </option>
                ))}
              </select>
            ) : (
              <StatusBadge status={lead.status} />
            )}
          </div>
          <div>
            <p className="mb-2 text-xs font-medium uppercase text-slate-500">Assigned counselor</p>
            <select
              value={lead.assignedCounselorId ?? ""}
              disabled={!permissions.canEditLeads}
              onChange={(event) => handleAssign(event.target.value)}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm disabled:bg-slate-50"
            >
              <option value="">Unassigned</option>
              {counselors.map((person) => (
                <option key={person.id} value={person.id}>
                  {person.name}
                </option>
              ))}
            </select>
          </div>
          {lead.notes ? <p className="text-sm text-slate-600">Notes: {lead.notes}</p> : null}
        </section>
        <section className="surface-card p-5 lg:col-span-2">
          <h2 className="mb-4 text-sm font-semibold text-slate-900">Tasks</h2>
          {tasks.length === 0 ? (
            <p className="text-sm text-slate-500">No follow-up tasks yet.</p>
          ) : (
            <ul className="space-y-2 text-sm">
              {tasks.map((task) => (
                <li key={task.id} className="flex justify-between gap-3 rounded-lg border border-slate-100 px-3 py-2">
                  <span>{task.title}</span>
                  <span className="text-slate-400">{task.status === "DONE" ? "Done" : formatDate(task.dueDate)}</span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        <section className="surface-card p-5">
          <h2 className="mb-4 text-sm font-semibold text-slate-900">Activity</h2>
          <ActivityTimeline items={activities} />
        </section>
        <LogActivityForm leadId={lead.id} />
      </div>
      <TaskFormModal
        isOpen={taskOpen}
        staff={staff}
        defaultAssigneeId={currentUserId}
        relatedLeadId={lead.id}
        isSubmitting={isSubmitting}
        error={formError}
        onClose={() => setTaskOpen(false)}
        onSubmit={handleTask}
      />
      <ConvertLeadModal
        isOpen={convertOpen}
        lead={lead}
        courses={courses}
        batches={batches}
        isSubmitting={isSubmitting}
        error={formError}
        onClose={() => setConvertOpen(false)}
        onSubmit={handleConvert}
      />
      <SendMessageModal
        isOpen={messageOpen}
        onClose={() => setMessageOpen(false)}
        templates={templates}
        leadId={lead.id}
        to={lead.phone}
        values={{
          studentName: lead.name,
          courseName: lead.courseInterested,
          amount: "",
          dueDate: "",
        }}
      />
    </div>
  );
};
