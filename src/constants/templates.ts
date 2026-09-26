export interface TemplateSeed {
  name: string;
  body: string;
}

export const DEFAULT_MESSAGE_TEMPLATES: TemplateSeed[] = [
  {
    name: "Welcome message",
    body: "Hi {studentName}, welcome to our institute. We are glad to have you with us.",
  },
  {
    name: "Fee reminder",
    body: "Hi {studentName}, a fee of {amount} is pending. Next due date: {dueDate}. Please ignore if already paid.",
  },
  {
    name: "Follow-up",
    body: "Hi {studentName}, just following up on your enquiry for {courseName}. Reply if you would like to schedule a call.",
  },
  {
    name: "Batch start reminder",
    body: "Hi {studentName}, your batch for {courseName} is starting soon. Please be ready on time.",
  },
];
