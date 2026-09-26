export const TASK_PRIORITIES = ["LOW", "MEDIUM", "HIGH"] as const;
export type TaskPriorityValue = (typeof TASK_PRIORITIES)[number];

export const TASK_STATUSES = ["PENDING", "DONE"] as const;
export type TaskStatusValue = (typeof TASK_STATUSES)[number];

export const PRIORITY_LABELS: Record<TaskPriorityValue, string> = {
  LOW: "Low",
  MEDIUM: "Medium",
  HIGH: "High",
};

export const PRIORITY_BADGE: Record<TaskPriorityValue, string> = {
  LOW: "bg-slate-100 text-slate-700 ring-slate-200",
  MEDIUM: "bg-amber-50 text-amber-700 ring-amber-200",
  HIGH: "bg-red-50 text-red-700 ring-red-200",
};
