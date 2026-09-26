import { z } from "zod";
import { TASK_PRIORITIES } from "@/constants/tasks";

export const taskFormSchema = z.object({
  title: z.string().trim().min(1, "Title is required"),
  dueDate: z.string().min(1, "Due date is required"),
  priority: z.enum(TASK_PRIORITIES),
  assignedToUserId: z.string().min(1, "Assignee is required"),
  relatedLeadId: z.string().optional(),
  relatedStudentId: z.string().optional(),
});

export type TaskFormValues = z.infer<typeof taskFormSchema>;
