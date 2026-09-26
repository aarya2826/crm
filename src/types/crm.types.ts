export interface StaffOption {
  id: string;
  name: string;
  role: string;
}

export interface TaskDto {
  id: string;
  title: string;
  dueDate: string;
  status: "PENDING" | "DONE";
  priority: "LOW" | "MEDIUM" | "HIGH";
  assignedToUserId: string;
  assignedToName: string;
  relatedLeadId: string | null;
  relatedLeadName: string | null;
  relatedStudentId: string | null;
  relatedStudentName: string | null;
}

export interface ActivityDto {
  id: string;
  type: "CALL" | "EMAIL" | "SMS" | "NOTE" | "MEETING";
  description: string;
  createdAt: string;
  createdByName: string;
}

export interface NotificationDto {
  id: string;
  title: string;
  message: string;
  href: string;
  readAt: string | null;
  createdAt: string;
}
