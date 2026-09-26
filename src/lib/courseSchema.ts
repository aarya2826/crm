import { z } from "zod";

export const courseFormSchema = z.object({
  name: z.string().trim().min(1, "Name is required"),
  duration: z.string().trim().min(1, "Duration is required"),
  totalFee: z.number().int().min(0, "Fee cannot be negative"),
});

export type CourseFormValues = z.infer<typeof courseFormSchema>;
