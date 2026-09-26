import type { StudentStatusValue } from "@/constants/students";

export interface CourseDto {
  id: string;
  name: string;
  duration: string;
  totalFee: number;
  createdAt: string;
}

export interface BatchDto {
  id: string;
  name: string;
  courseId: string;
  courseName: string;
  startDate: string;
  timing: string;
  createdAt: string;
}

export interface StudentDto {
  id: string;
  name: string;
  phone: string;
  email: string | null;
  courseId: string;
  courseName: string;
  batchId: string;
  batchName: string;
  enrollmentDate: string;
  status: StudentStatusValue;
  leadId: string | null;
  createdAt: string;
  updatedAt: string;
  attendancePercent: number | null;
}
