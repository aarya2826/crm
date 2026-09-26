export const ACTIVITY_TYPES = ["CALL", "EMAIL", "SMS", "NOTE", "MEETING"] as const;
export type ActivityTypeValue = (typeof ACTIVITY_TYPES)[number];

export const ACTIVITY_LABELS: Record<ActivityTypeValue, string> = {
  CALL: "Call",
  EMAIL: "Email",
  SMS: "SMS",
  NOTE: "Note",
  MEETING: "Meeting",
};
