import type { LeadSourceValue, LeadStatusValue } from "@/constants/leads";

export interface LeadDto {
  id: string;
  name: string;
  phone: string;
  email: string | null;
  source: LeadSourceValue;
  courseInterested: string;
  status: LeadStatusValue;
  notes: string | null;
  nextFollowUpDate: string | null;
  assignedCounselorId: string | null;
  assignedCounselorName: string | null;
  score: number;
  createdAt: string;
  updatedAt: string;
}

export interface ActionResult {
  success: boolean;
  error?: string;
}
