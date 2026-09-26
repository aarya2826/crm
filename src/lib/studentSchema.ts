import { z } from "zod";
import { STUDENT_STATUSES } from "@/constants/students";

const optionalEmail = z
  .string()
  .trim()
  .optional()
  .refine((value) => !value || z.string().email().safeParse(value).success, {
    message: "Enter a valid email",
  });

export const studentFormSchema = z.object({
  name: z.string().trim().min(1, "Name is required"),
  phone: z.string().trim().min(1, "Phone is required"),
  email: optionalEmail,
  courseId: z.string().min(1, "Course is required"),
  batchId: z.string().min(1, "Batch is required"),
  enrollmentDate: z.string().min(1, "Enrollment date is required"),
  status: z.enum(STUDENT_STATUSES),
});

export const convertLeadSchema = studentFormSchema.omit({ status: true });

export type StudentFormValues = z.infer<typeof studentFormSchema>;
export type ConvertLeadFormValues = z.infer<typeof convertLeadSchema>;

export function toStudentWriteData(values: StudentFormValues) {
  return {
    name: values.name.trim(),
    phone: values.phone.trim(),
    email: values.email?.trim() ? values.email.trim() : null,
    courseId: values.courseId,
    batchId: values.batchId,
    enrollmentDate: new Date(values.enrollmentDate),
    status: values.status,
  };
}
