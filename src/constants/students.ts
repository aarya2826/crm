export const STUDENT_STATUSES = [
  "ACTIVE",
  "ON_HOLD",
  "COMPLETED",
  "DROPPED",
] as const;

export type StudentStatusValue = (typeof STUDENT_STATUSES)[number];

export const STUDENT_STATUS_LABELS: Record<StudentStatusValue, string> = {
  ACTIVE: "Active",
  ON_HOLD: "On Hold",
  COMPLETED: "Completed",
  DROPPED: "Dropped",
};

export const STUDENT_STATUS_BADGE_CLASSES: Record<StudentStatusValue, string> = {
  ACTIVE: "bg-brand-50 text-brand-700 ring-brand-200",
  ON_HOLD: "bg-amber-50 text-amber-700 ring-amber-200",
  COMPLETED: "bg-green-50 text-green-800 ring-green-200",
  DROPPED: "bg-slate-100 text-slate-600 ring-slate-200",
};
