import { z } from "zod";
import { LEAD_SOURCES, LEAD_STATUSES } from "@/constants/leads";

export const leadFormSchema = z.object({
  name: z.string().trim().min(1, "Name is required"),
  phone: z.string().trim().min(1, "Phone is required"),
  email: z
    .string()
    .trim()
    .optional()
    .refine((value) => !value || z.string().email().safeParse(value).success, {
      message: "Enter a valid email",
    }),
  source: z.enum(LEAD_SOURCES),
  courseInterested: z.string().trim(),
  status: z.enum(LEAD_STATUSES),
  notes: z.string().optional(),
  nextFollowUpDate: z.string().optional(),
  assignedCounselorId: z.string().optional(),
});

export type LeadFormValues = z.infer<typeof leadFormSchema>;

export function toLeadWriteData(values: LeadFormValues) {
  return {
    name: values.name.trim(),
    phone: values.phone.trim(),
    email: values.email?.trim() ? values.email.trim() : null,
    source: values.source,
    courseInterested: values.courseInterested.trim(),
    status: values.status,
    notes: values.notes?.trim() ? values.notes.trim() : null,
    nextFollowUpDate: values.nextFollowUpDate
      ? new Date(values.nextFollowUpDate)
      : null,
    assignedCounselorId: values.assignedCounselorId || null,
  };
}
