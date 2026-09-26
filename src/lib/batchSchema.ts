import { z } from "zod";

export const batchFormSchema = z.object({
  name: z.string().trim().min(1, "Name is required"),
  courseId: z.string().min(1, "Course is required"),
  startDate: z.string().min(1, "Start date is required"),
  timing: z.string().trim().min(1, "Timing is required"),
});

export type BatchFormValues = z.infer<typeof batchFormSchema>;
