import { z } from "zod";
import { ACTIVITY_TYPES } from "@/constants/activity";

export const activityFormSchema = z.object({
  type: z.enum(ACTIVITY_TYPES),
  description: z.string().trim().min(1, "Description is required"),
  leadId: z.string().optional(),
  studentId: z.string().optional(),
});

export type ActivityFormValues = z.infer<typeof activityFormSchema>;
