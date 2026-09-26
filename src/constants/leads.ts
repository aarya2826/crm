export const LEAD_SOURCES = [
  "WEBSITE",
  "REFERRAL",
  "WALK_IN",
  "SOCIAL_MEDIA",
] as const;

export const LEAD_STATUSES = [
  "NEW",
  "CONTACTED",
  "FOLLOW_UP",
  "INTERESTED",
  "CONVERTED",
  "LOST",
] as const;

export type LeadSourceValue = (typeof LEAD_SOURCES)[number];
export type LeadStatusValue = (typeof LEAD_STATUSES)[number];

export const SOURCE_LABELS: Record<LeadSourceValue, string> = {
  WEBSITE: "Website",
  REFERRAL: "Referral",
  WALK_IN: "Walk-in",
  SOCIAL_MEDIA: "Social Media",
};

export const STATUS_LABELS: Record<LeadStatusValue, string> = {
  NEW: "New",
  CONTACTED: "Contacted",
  FOLLOW_UP: "Follow Up",
  INTERESTED: "Interested",
  CONVERTED: "Converted",
  LOST: "Lost",
};

export const STATUS_BADGE_CLASSES: Record<LeadStatusValue, string> = {
  NEW: "bg-brand-50 text-brand-700 ring-brand-200 dark:bg-brand-900/30 dark:text-brand-200 dark:ring-brand-800",
  CONTACTED: "bg-indigo-50 text-indigo-700 ring-indigo-200 dark:bg-indigo-900/30 dark:text-indigo-200",
  FOLLOW_UP: "bg-amber-50 text-amber-700 ring-amber-200 dark:bg-amber-900/30 dark:text-amber-200",
  INTERESTED: "bg-teal-50 text-teal-700 ring-teal-500/30 dark:bg-teal-700/20 dark:text-teal-200",
  CONVERTED: "bg-green-50 text-green-800 ring-green-200 dark:bg-green-900/30 dark:text-green-200",
  LOST: "bg-slate-100 text-slate-600 ring-slate-200 dark:bg-slate-800 dark:text-slate-300",
};

export const STATUS_CHART_COLORS: Record<LeadStatusValue, string> = {
  NEW: "#4f46e5",
  CONTACTED: "#6366f1",
  FOLLOW_UP: "#d97706",
  INTERESTED: "#0d9488",
  CONVERTED: "#16a34a",
  LOST: "#64748b",
};

export const SOURCE_CHART_COLORS: Record<LeadSourceValue, string> = {
  WEBSITE: "#4f46e5",
  REFERRAL: "#7c3aed",
  WALK_IN: "#f59e0b",
  SOCIAL_MEDIA: "#0d9488",
};
