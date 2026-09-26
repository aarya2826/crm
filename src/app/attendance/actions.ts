"use server";

/** Batch attendance sheet load/save and per-student attendance history. */

import { revalidatePath } from "next/cache";
import type { AttendanceStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireActionRole } from "@/lib/session";
import type { ActionResult } from "@/types/lead.types";

export interface AttendanceRow {
  studentId: string;
  studentName: string;
  batchName: string;
  status: AttendanceStatus | null;
}

export interface AttendanceDay {
  date: string;
  status: AttendanceStatus | null;
}

export interface StudentAttendanceView {
  present: number;
  absent: number;
  late: number;
  total: number;
  monthPercent: number | null;
  days: AttendanceDay[];
}

function dayStart(value: Date): Date {
  return new Date(value.getFullYear(), value.getMonth(), value.getDate());
}

function parseDay(value: string): Date {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(year, (month ?? 1) - 1, day ?? 1);
}

export async function getAttendanceSheet(
  batchId: string,
  dateValue: string
): Promise<AttendanceRow[]> {
  const access = await requireActionRole(["ADMIN", "TEACHER"]);
  if (!access.ok) {
    return [];
  }
  if (!batchId) {
    return [];
  }

  const date = parseDay(dateValue);
  const [students, marks] = await Promise.all([
    prisma.student.findMany({
      where: { batchId, status: "ACTIVE" },
      include: { batch: true },
      orderBy: { name: "asc" },
    }),
    prisma.attendance.findMany({ where: { batchId, date } }),
  ]);
  const byStudent = new Map(marks.map((row) => [row.studentId, row.status]));

  return students.map((student) => ({
    studentId: student.id,
    studentName: student.name,
    batchName: student.batch.name,
    status: byStudent.get(student.id) ?? null,
  }));
}

export async function saveAttendance(input: {
  batchId: string;
  dateValue: string;
  marks: Array<{ studentId: string; status: AttendanceStatus }>;
}): Promise<ActionResult> {
  const access = await requireActionRole(["ADMIN", "TEACHER"]);
  if (!access.ok) {
    return access;
  }
  try {
    if (!input.batchId || !input.dateValue || !Array.isArray(input.marks)) {
      return { success: false, error: "Invalid attendance payload." };
    }
    const allowed = new Set<AttendanceStatus>(["PRESENT", "ABSENT", "LATE"]);
    if (input.marks.some((mark) => !mark.studentId || !allowed.has(mark.status))) {
      return { success: false, error: "Invalid attendance payload." };
    }
    const date = parseDay(input.dateValue);
    await prisma.$transaction(
      input.marks.map((mark) =>
        prisma.attendance.upsert({
          where: { studentId_date: { studentId: mark.studentId, date } },
          update: { status: mark.status, markedByUserId: access.user.id, batchId: input.batchId },
          create: {
            studentId: mark.studentId,
            batchId: input.batchId,
            date,
            status: mark.status,
            markedByUserId: access.user.id,
          },
        })
      )
    );
    revalidatePath("/attendance");
    revalidatePath("/students");
    return { success: true };
  } catch (error) {
    console.error("Failed to save attendance:", error);
    return { success: false, error: "Could not save attendance." };
  }
}

export async function getStudentAttendanceView(studentId: string): Promise<StudentAttendanceView> {
  const rows = await prisma.attendance.findMany({
    where: { studentId },
    orderBy: { date: "desc" },
  });
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const monthRows = rows.filter((row) => row.date >= monthStart);
  const attended = monthRows.filter((row) => row.status === "PRESENT" || row.status === "LATE").length;
  const days: AttendanceDay[] = [];
  for (let index = 29; index >= 0; index -= 1) {
    const date = dayStart(new Date(now.getFullYear(), now.getMonth(), now.getDate() - index));
    const match = rows.find((row) => row.date.getTime() === date.getTime());
    days.push({ date: date.toISOString(), status: match?.status ?? null });
  }
  return {
    present: rows.filter((row) => row.status === "PRESENT").length,
    absent: rows.filter((row) => row.status === "ABSENT").length,
    late: rows.filter((row) => row.status === "LATE").length,
    total: rows.length,
    monthPercent: monthRows.length === 0 ? null : Math.round((attended / monthRows.length) * 100),
    days,
  };
}
