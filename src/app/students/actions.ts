"use server";

/** Student enrollments, conversion from leads, and bulk status/delete. */

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireActionRole } from "@/lib/session";
import { getStudentAttendanceView } from "@/app/attendance/actions";
import {
  convertLeadSchema,
  studentFormSchema,
  toStudentWriteData,
} from "@/lib/studentSchema";
import type { ConvertLeadFormValues, StudentFormValues } from "@/lib/studentSchema";
import type { StudentDto } from "@/types/academic.types";
import type { ActionResult } from "@/types/lead.types";
import type { StudentStatusValue } from "@/constants/students";
import { PAGE_SIZE, parseDir, parsePage, skipTake, type PagedResult } from "@/lib/query";
import type { Prisma } from "@prisma/client";

function toStudentDto(student: {
  id: string;
  name: string;
  phone: string;
  email: string | null;
  courseId: string;
  batchId: string;
  enrollmentDate: Date;
  status: StudentStatusValue;
  leadId: string | null;
  createdAt: Date;
  updatedAt: Date;
  course: { name: string };
  batch: { name: string };
}): StudentDto {
  return {
    id: student.id,
    name: student.name,
    phone: student.phone,
    email: student.email,
    courseId: student.courseId,
    courseName: student.course.name,
    batchId: student.batchId,
    batchName: student.batch.name,
    enrollmentDate: student.enrollmentDate.toISOString(),
    status: student.status,
    leadId: student.leadId,
    createdAt: student.createdAt.toISOString(),
    updatedAt: student.updatedAt.toISOString(),
    attendancePercent: null,
  };
}

function refreshStudentPages(): void {
  revalidatePath("/students");
  revalidatePath("/leads");
  revalidatePath("/fees");
  revalidatePath("/");
}

async function assertBatchMatchesCourse(
  courseId: string,
  batchId: string
): Promise<boolean> {
  const batch = await prisma.batch.findUnique({ where: { id: batchId } });
  return Boolean(batch && batch.courseId === courseId);
}

export async function getStudents(): Promise<StudentDto[]> {
  try {
    const students = await prisma.student.findMany({
      include: { course: true, batch: true },
      orderBy: { createdAt: "desc" },
      take: 5000,
    });
    return students.map((student) => toStudentDto(student));
  } catch (error) {
    console.error("Failed to fetch students:", error);
    return [];
  }
}

export async function getStudentsPage(input: {
  search?: string;
  courseId?: string;
  batchId?: string;
  status?: string;
  page?: string;
  sort?: string;
  dir?: string;
}): Promise<PagedResult<StudentDto>> {
  const search = input.search?.trim() ?? "";
  const page = parsePage(input.page);
  const dir = parseDir(input.dir);
  const sort = input.sort || "createdAt";
  const where: Prisma.StudentWhereInput = {};
  if (input.status && input.status !== "ALL") {
    where.status = input.status as StudentStatusValue;
  }
  if (input.courseId) {
    where.courseId = input.courseId;
  }
  if (input.batchId) {
    where.batchId = input.batchId;
  }
  if (search) {
    where.OR = [
      { name: { contains: search, mode: "insensitive" } },
      { phone: { contains: search, mode: "insensitive" } },
    ];
  }
  const orderBy: Prisma.StudentOrderByWithRelationInput =
    sort === "name"
      ? { name: dir }
      : sort === "phone"
        ? { phone: dir }
        : sort === "status"
          ? { status: dir }
          : sort === "enrollmentDate"
            ? { enrollmentDate: dir }
            : sort === "courseName"
              ? { course: { name: dir } }
              : sort === "batchName"
                ? { batch: { name: dir } }
                : { createdAt: dir };

  try {
    const { skip, take } = skipTake(page);
    const monthStart = new Date();
    monthStart.setDate(1);
    monthStart.setHours(0, 0, 0, 0);
    const [total, students] = await Promise.all([
      prisma.student.count({ where }),
      prisma.student.findMany({
        where,
        include: { course: true, batch: true },
        orderBy,
        skip,
        take,
      }),
    ]);
    const ids = students.map((student) => student.id);
    const attendance = ids.length
      ? await prisma.attendance.groupBy({
          by: ["studentId", "status"],
          where: { studentId: { in: ids }, date: { gte: monthStart } },
          _count: { _all: true },
        })
      : [];
    const percentByStudent = new Map<string, { attended: number; total: number }>();
    attendance.forEach((row) => {
      const current = percentByStudent.get(row.studentId) ?? { attended: 0, total: 0 };
      current.total += row._count._all;
      if (row.status === "PRESENT" || row.status === "LATE") {
        current.attended += row._count._all;
      }
      percentByStudent.set(row.studentId, current);
    });
    return {
      rows: students.map((student) => {
        const dto = toStudentDto(student);
        const stats = percentByStudent.get(student.id);
        dto.attendancePercent =
          !stats || stats.total === 0 ? null : Math.round((stats.attended / stats.total) * 100);
        return dto;
      }),
      total,
      page,
      pageSize: PAGE_SIZE,
      sort,
      dir,
    };
  } catch (error) {
    console.error("Failed to fetch students page:", error);
    return { rows: [], total: 0, page: 1, pageSize: PAGE_SIZE, sort, dir };
  }
}

export async function getStudentById(id: string): Promise<StudentDto | null> {
  try {
    const student = await prisma.student.findUnique({
      where: { id },
      include: { course: true, batch: true },
    });
    return student ? toStudentDto(student) : null;
  } catch (error) {
    console.error("Failed to load student:", error);
    return null;
  }
}

export async function getStudentAttendanceSummary(studentId: string) {
  return getStudentAttendanceView(studentId);
}

export async function createStudent(values: StudentFormValues): Promise<ActionResult> {
  const access = await requireActionRole(["ADMIN", "COUNSELOR"]);
  if (!access.ok) {
    return access;
  }

  try {
    const parsed = studentFormSchema.safeParse(values);
    if (!parsed.success) {
      return { success: false, error: "Please fix the form errors and try again." };
    }

    const matches = await assertBatchMatchesCourse(
      parsed.data.courseId,
      parsed.data.batchId
    );
    if (!matches) {
      return { success: false, error: "Selected batch does not belong to that course." };
    }

    await prisma.student.create({ data: toStudentWriteData(parsed.data) });
    refreshStudentPages();
    return { success: true };
  } catch (error) {
    console.error("Failed to create student:", error);
    return { success: false, error: "Could not create student. Please try again." };
  }
}

export async function updateStudent(
  id: string,
  values: StudentFormValues
): Promise<ActionResult> {
  const access = await requireActionRole(["ADMIN", "COUNSELOR"]);
  if (!access.ok) {
    return access;
  }

  try {
    const parsed = studentFormSchema.safeParse(values);
    if (!parsed.success) {
      return { success: false, error: "Please fix the form errors and try again." };
    }

    const matches = await assertBatchMatchesCourse(
      parsed.data.courseId,
      parsed.data.batchId
    );
    if (!matches) {
      return { success: false, error: "Selected batch does not belong to that course." };
    }

    await prisma.student.update({
      where: { id },
      data: toStudentWriteData(parsed.data),
    });
    refreshStudentPages();
    return { success: true };
  } catch (error) {
    console.error("Failed to update student:", error);
    return { success: false, error: "Could not update student. Please try again." };
  }
}

export async function deleteStudent(id: string): Promise<ActionResult> {
  const access = await requireActionRole(["ADMIN"]);
  if (!access.ok) {
    return access;
  }

  try {
    const payments = await prisma.payment.count({ where: { studentId: id } });
    if (payments > 0) {
      return {
        success: false,
        error: "This student has fee payments. Delete is blocked to protect financial records.",
      };
    }
    await prisma.student.delete({ where: { id } });
    refreshStudentPages();
    return { success: true };
  } catch (error) {
    console.error("Failed to delete student:", error);
    return { success: false, error: "Could not delete student. Please try again." };
  }
}

export async function convertLeadToStudent(
  leadId: string,
  values: ConvertLeadFormValues
): Promise<ActionResult> {
  const access = await requireActionRole(["ADMIN", "COUNSELOR"]);
  if (!access.ok) {
    return access;
  }

  try {
    const parsed = convertLeadSchema.safeParse(values);
    if (!parsed.success) {
      return { success: false, error: "Please fix the form errors and try again." };
    }

    const matches = await assertBatchMatchesCourse(
      parsed.data.courseId,
      parsed.data.batchId
    );
    if (!matches) {
      return { success: false, error: "Selected batch does not belong to that course." };
    }

    const lead = await prisma.lead.findUnique({ where: { id: leadId } });
    if (!lead) {
      return { success: false, error: "Lead not found." };
    }
    if (lead.status === "CONVERTED") {
      return { success: false, error: "This lead is already converted." };
    }

    await prisma.$transaction([
      prisma.student.create({
        data: {
          ...toStudentWriteData({ ...parsed.data, status: "ACTIVE" }),
          leadId,
        },
      }),
      prisma.lead.update({
        where: { id: leadId },
        data: { status: "CONVERTED" },
      }),
    ]);

    refreshStudentPages();
    return { success: true };
  } catch (error) {
    console.error("Failed to convert lead:", error);
    return { success: false, error: "Could not convert lead. Please try again." };
  }
}

export async function updateStudentStatus(
  id: string,
  status: StudentStatusValue
): Promise<ActionResult> {
  const access = await requireActionRole(["ADMIN", "COUNSELOR"]);
  if (!access.ok) {
    return access;
  }
  try {
    await prisma.student.update({ where: { id }, data: { status } });
    refreshStudentPages();
    return { success: true };
  } catch (error) {
    console.error("Failed to update student status:", error);
    return { success: false, error: "Could not update status." };
  }
}

export async function bulkUpdateStudentStatus(
  ids: string[],
  status: StudentStatusValue
): Promise<ActionResult> {
  const access = await requireActionRole(["ADMIN", "COUNSELOR"]);
  if (!access.ok) {
    return access;
  }
  if (ids.length === 0) {
    return { success: false, error: "Select at least one student." };
  }
  try {
    await prisma.student.updateMany({ where: { id: { in: ids } }, data: { status } });
    refreshStudentPages();
    return { success: true };
  } catch (error) {
    console.error("Failed to bulk update students:", error);
    return { success: false, error: "Could not update status." };
  }
}

export async function bulkDeleteStudents(ids: string[]): Promise<ActionResult> {
  const access = await requireActionRole(["ADMIN"]);
  if (!access.ok) {
    return access;
  }
  if (ids.length === 0) {
    return { success: false, error: "Select at least one student." };
  }
  try {
    const paid = await prisma.payment.count({
      where: { studentId: { in: ids } },
    });
    if (paid > 0) {
      return {
        success: false,
        error: "One or more selected students have fee payments and cannot be deleted.",
      };
    }
    await prisma.student.deleteMany({ where: { id: { in: ids } } });
    refreshStudentPages();
    return { success: true };
  } catch (error) {
    console.error("Failed to bulk delete students:", error);
    return { success: false, error: "Could not delete selected students." };
  }
}
