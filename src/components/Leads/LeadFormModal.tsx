"use client";

import { useEffect } from "react";
import type { FC, ReactNode } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  LEAD_SOURCES,
  LEAD_STATUSES,
  SOURCE_LABELS,
  STATUS_LABELS,
} from "@/constants/leads";
import { leadFormSchema, type LeadFormValues } from "@/lib/leadSchema";
import { inputClass } from "@/components/common/FormField";
import { toDateInputValue } from "@/lib/formatDate";
import type { LeadDto } from "@/types/lead.types";

interface LeadFormModalProps {
  isOpen: boolean;
  lead: LeadDto | null;
  isSubmitting: boolean;
  error: string | null;
  onClose: () => void;
  onSubmit: (values: LeadFormValues) => Promise<void>;
}

const defaultValues: LeadFormValues = {
  name: "",
  phone: "",
  email: "",
  source: "WEBSITE",
  courseInterested: "",
  status: "NEW",
  notes: "",
  nextFollowUpDate: "",
  assignedCounselorId: "",
};

export const LeadFormModal: FC<LeadFormModalProps> = ({
  isOpen,
  lead,
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
  } = useForm<LeadFormValues>({
    resolver: zodResolver(leadFormSchema),
    defaultValues,
  });

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    reset(
      lead
        ? {
            name: lead.name,
            phone: lead.phone,
            email: lead.email ?? "",
            source: lead.source,
            courseInterested: lead.courseInterested,
            status: lead.status,
            notes: lead.notes ?? "",
            nextFollowUpDate: lead.nextFollowUpDate
              ? toDateInputValue(lead.nextFollowUpDate)
              : "",
            assignedCounselorId: lead.assignedCounselorId ?? "",
          }
        : defaultValues
    );
  }, [isOpen, lead, reset]);

  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4">
      <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl">
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-slate-900">
            {lead ? "Edit Lead" : "Add New Lead"}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md px-2 py-1 text-sm text-slate-500 hover:bg-slate-100"
          >
            Close
          </button>
        </div>
        <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
          <Field label="Name" error={errors.name?.message}>
            <input
              {...register("name")}
              className={inputClass}
              placeholder="Lead name"
            />
          </Field>
          <Field label="Phone" error={errors.phone?.message}>
            <input
              {...register("phone")}
              className={inputClass}
              placeholder="Phone number"
            />
          </Field>
          <Field label="Email" error={errors.email?.message}>
            <input
              {...register("email")}
              className={inputClass}
              placeholder="Optional email"
            />
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Source" error={errors.source?.message}>
              <select {...register("source")} className={inputClass}>
                {LEAD_SOURCES.map((source) => (
                  <option key={source} value={source}>
                    {SOURCE_LABELS[source]}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Status" error={errors.status?.message}>
              <select {...register("status")} className={inputClass}>
                {LEAD_STATUSES.map((status) => (
                  <option key={status} value={status}>
                    {STATUS_LABELS[status]}
                  </option>
                ))}
              </select>
            </Field>
          </div>
          <Field label="Course Interested" error={errors.courseInterested?.message}>
            <input
              {...register("courseInterested")}
              className={inputClass}
              placeholder="e.g. Full Stack Development"
            />
          </Field>
          <Field label="Next Follow-up Date" error={errors.nextFollowUpDate?.message}>
            <input type="date" {...register("nextFollowUpDate")} className={inputClass} />
          </Field>
          <Field label="Notes" error={errors.notes?.message}>
            <textarea
              {...register("notes")}
              rows={3}
              className={inputClass}
              placeholder="Optional notes"
            />
          </Field>
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
              {isSubmitting ? "Saving..." : "Save Lead"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

interface FieldProps {
  label: string;
  error?: string;
  children: ReactNode;
}

const Field: FC<FieldProps> = ({ label, error, children }) => {
  return (
    <label className="block space-y-1.5">
      <span className="text-sm font-medium text-slate-700">{label}</span>
      {children}
      {error ? <span className="text-xs text-red-600">{error}</span> : null}
    </label>
  );
};
