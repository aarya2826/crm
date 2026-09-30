"use server";

/** Fee rows, payment recording, reminders, and payment export. */

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireActionRole } from "@/lib/session";
import { paymentFormSchema } from "@/lib/paymentSchema";
import type { PaymentFormValues } from "@/lib/paymentSchema";
import { sendReminder } from "@/lib/messaging";
import type { PaymentDto, StudentFeeRow } from "@/types/fee.types";
import type { ActionResult } from "@/types/lead.types";
import { PAGE_SIZE, parseDir, parsePage, skipTake, type PagedResult } from "@/lib/query";
import type { Prisma } from "@prisma/client";
import type { FeePaymentStatus, PaymentModeValue } from "@/constants/fees";

function toPaymentDto(payment: {
  id: string;
  studentId: string;
  amount: number;
  paymentDate: Date;
  mode: PaymentModeValue;
  installmentNumber: number;
  notes: string | null;
  createdAt: Date;
  invoice: { invoiceNumber: number; taxAmount: number; nextDueDate: Date | null } | null;
}): PaymentDto {
  return {
    id: payment.id,
    studentId: payment.studentId,
    amount: payment.amount,
    paymentDate: payment.paymentDate.toISOString(),
    mode: payment.mode,
    installmentNumber: payment.installmentNumber,
    notes: payment.notes,
    createdAt: payment.createdAt.toISOString(),
    invoiceNumber: payment.invoice?.invoiceNumber ?? null,
    taxAmount: payment.invoice?.taxAmount ?? 0,
    nextDueDate: payment.invoice?.nextDueDate?.toISOString() ?? null,
  };
}

function feeStatus(totalFee: number, amountPaid: number): FeePaymentStatus {
  if (amountPaid <= 0) {
    return "PENDING";
  }
  if (amountPaid >= totalFee) {
    return "PAID";
  }
  return "PARTIAL";
}

function refreshFeePages(): void {
  revalidatePath("/fees");
  revalidatePath("/");
}

export async function getStudentFeeRow(studentId: string): Promise<StudentFeeRow | null> {
  const rows = await buildFeeRows({ id: studentId });
  return rows[0] ?? null;
}

export async function getStudentPayments(studentId: string): Promise<PaymentDto[]> {
  const payments = await prisma.payment.findMany({
    where: { studentId },
    include: { invoice: true },
    orderBy: { paymentDate: "desc" },
  });
  return payments.map(toPaymentDto);
}

export async function getStudentFeePage(input: {
  search?: string;
  courseId?: string;
  status?: string;
  page?: string;
  sort?: string;
  dir?: string;
  pageSize?: number;
}): Promise<PagedResult<StudentFeeRow>> {
  const search = input.search?.trim() ?? "";
  const page = parsePage(input.page);
  const dir = parseDir(input.dir);
  const sort = input.sort || "studentName";
  const pageSize = input.pageSize ?? PAGE_SIZE;
  const where: Prisma.StudentWhereInput = {};
  if (input.courseId) {
    where.courseId = input.courseId;
  }
  if (search) {
    where.name = { contains: search, mode: "insensitive" };
  }

  try {
    const statusFilter = input.status && input.status !== "ALL";
    const computedSort = ["totalFee", "amountPaid", "pendingAmount", "status", "courseName"].includes(sort);
    const needsAllRows = Boolean(statusFilter) || computedSort;
    const totalMatching = await prisma.student.count({ where });
    const pageQuery = needsAllRows ? {} : skipTake(page, pageSize);
    const students = await prisma.student.findMany({
      where,
      ...pageQuery,
      select: {
        id: true,
        name: true,
        phone: true,
        email: true,
        courseId: true,
        createdAt: true,
        course: {
          select: {
            name: true,
            totalFee: true,
            feeStructures: { orderBy: { createdAt: "desc" }, take: 1, select: { totalAmount: true, numberOfInstallments: true } },
          },
        },
      },
      orderBy: sort === "studentName" ? { name: dir } : { createdAt: "desc" },
    });
    const ids = students.map((student) => student.id);
    const sums = ids.length
      ? await prisma.payment.groupBy({
          by: ["studentId"],
          where: { studentId: { in: ids } },
          _sum: { amount: true },
        })
      : [];
    const paidByStudent = new Map(sums.map((row) => [row.studentId, row._sum.amount ?? 0]));
    let rows: StudentFeeRow[] = students.map((student) => {
      const totalFee = student.course.feeStructures[0]?.totalAmount ?? student.course.totalFee;
      const amountPaid = paidByStudent.get(student.id) ?? 0;
      const pendingAmount = Math.max(0, totalFee - amountPaid);
      return {
        studentId: student.id,
        studentName: student.name,
        studentPhone: student.phone,
        studentEmail: student.email,
        courseId: student.courseId,
        courseName: student.course.name,
        totalFee,
        amountPaid,
        pendingAmount,
        status: feeStatus(totalFee, amountPaid),
        installments: student.course.feeStructures[0]?.numberOfInstallments ?? 1,
        payments: [],
      };
    });
    if (statusFilter) {
      rows = rows.filter((row) => row.status === input.status);
    }
    if (computedSort) {
      rows.sort((left, right) => {
        const value = (row: StudentFeeRow): string | number => {
          if (sort === "totalFee") return row.totalFee;
          if (sort === "amountPaid") return row.amountPaid;
          if (sort === "pendingAmount") return row.pendingAmount;
          if (sort === "courseName") return row.courseName;
          if (sort === "status") return row.status;
          return row.studentName;
        };
        const a = value(left);
        const b = value(right);
        if (typeof a === "number" && typeof b === "number") {
          return dir === "asc" ? a - b : b - a;
        }
        const result = String(a).localeCompare(String(b), "en", { sensitivity: "base" });
        return dir === "asc" ? result : -result;
      });
    }
    if (needsAllRows) {
      const total = rows.length;
      const start = (Math.max(1, page) - 1) * pageSize;
      return {
        rows: rows.slice(start, start + pageSize),
        total,
        page,
        pageSize,
        sort,
        dir,
      };
    }
    return {
      rows,
      total: totalMatching,
      page,
      pageSize,
      sort,
      dir,
    };
  } catch (error) {
    console.error("Failed to fetch fee rows:", error);
    return { rows: [], total: 0, page: 1, pageSize, sort, dir };
  }
}

async function buildFeeRows(where: Prisma.StudentWhereInput): Promise<StudentFeeRow[]> {
  const students = await prisma.student.findMany({
    where,
    include: {
      course: { include: { feeStructures: { orderBy: { createdAt: "desc" }, take: 1 } } },
      payments: { include: { invoice: true }, orderBy: { paymentDate: "desc" } },
    },
  });
  return students.map((student) => {
    const structure = student.course.feeStructures[0];
    const totalFee = structure?.totalAmount ?? student.course.totalFee;
    const amountPaid = student.payments.reduce((sum, payment) => sum + payment.amount, 0);
    return {
      studentId: student.id,
      studentName: student.name,
      studentPhone: student.phone,
      studentEmail: student.email,
      courseId: student.courseId,
      courseName: student.course.name,
      totalFee,
      amountPaid,
      pendingAmount: Math.max(0, totalFee - amountPaid),
      status: feeStatus(totalFee, amountPaid),
      installments: structure?.numberOfInstallments ?? 1,
      payments: student.payments.map(toPaymentDto),
    };
  });
}

export async function recordPayment(
  studentId: string,
  values: PaymentFormValues
): Promise<ActionResult> {
  const access = await requireActionRole(["ADMIN", "ACCOUNTANT"]);
  if (!access.ok) {
    return access;
  }

  try {
    const parsed = paymentFormSchema.safeParse(values);
    if (!parsed.success) {
      return { success: false, error: "Please fix the form errors and try again." };
    }

    const student = await prisma.student.findUnique({
      where: { id: studentId },
      include: {
        course: { include: { feeStructures: { orderBy: { createdAt: "desc" }, take: 1 } } },
        payments: { select: { amount: true } },
      },
    });
    if (!student) {
      return { success: false, error: "Student not found." };
    }

    const totalFee = student.course.feeStructures[0]?.totalAmount ?? student.course.totalFee;
    const alreadyPaid = student.payments.reduce((sum, payment) => sum + payment.amount, 0);
    const remainingAfter = Math.max(0, totalFee - alreadyPaid - parsed.data.amount);
    const nextDueDate =
      remainingAfter > 0
        ? new Date(new Date(parsed.data.paymentDate).getTime() + 30 * 24 * 60 * 60 * 1000)
        : null;
    const taxAmount = parsed.data.taxAmount ?? 0;

    await prisma.$transaction(async (tx) => {
      const payment = await tx.payment.create({
        data: {
          studentId,
          amount: parsed.data.amount,
          paymentDate: new Date(parsed.data.paymentDate),
          mode: parsed.data.mode,
          installmentNumber: parsed.data.installmentNumber,
          notes: parsed.data.notes?.trim() ? parsed.data.notes.trim() : null,
        },
      });
      const setting = await tx.instituteSetting.upsert({
        where: { id: "main" },
        update: {},
        create: { id: "main", instituteName: "Your Institute", nextInvoiceNumber: 1 },
      });
      const invoiceNumber = setting.nextInvoiceNumber;
      await tx.invoice.create({
        data: {
          invoiceNumber,
          paymentId: payment.id,
          taxAmount,
          nextDueDate,
        },
      });
      await tx.instituteSetting.update({
        where: { id: "main" },
        data: { nextInvoiceNumber: invoiceNumber + 1 },
      });
    });
    refreshFeePages();
    revalidatePath(`/students/${studentId}`);
    return { success: true };
  } catch (error) {
    console.error("Failed to record payment:", error);
    return { success: false, error: "Could not record payment. Please try again." };
  }
}

export async function getPaymentsForExport(): Promise<Array<[string, string, number, string, string]>> {
  const payments = await prisma.payment.findMany({
    take: 5000,
    orderBy: { paymentDate: "desc" },
    select: {
      amount: true,
      paymentDate: true,
      mode: true,
      student: { select: { name: true, course: { select: { name: true } } } },
    },
  });
  return payments.map((payment) => [
    payment.student.name,
    payment.student.course.name,
    payment.amount,
    payment.paymentDate.toISOString(),
    payment.mode,
  ]);
}

export async function sendFeeReminder(studentId: string): Promise<ActionResult> {
  const access = await requireActionRole(["ADMIN", "ACCOUNTANT"]);
  if (!access.ok) {
    return access;
  }
  try {
    const student = await prisma.student.findUnique({
      where: { id: studentId },
      include: {
        course: { include: { feeStructures: { orderBy: { createdAt: "desc" }, take: 1 } } },
        payments: true,
      },
    });
    if (!student) {
      return { success: false, error: "Student not found." };
    }
    const totalFee = student.course.feeStructures[0]?.totalAmount ?? student.course.totalFee;
    const paid = student.payments.reduce((sum, payment) => sum + payment.amount, 0);
    const pending = Math.max(0, totalFee - paid);
    if (pending <= 0) {
      return { success: false, error: "This student has no pending installment." };
    }
    const body = `Fee reminder: ${student.name} has a pending amount of ${pending}.`;
    sendReminder({ channel: "SMS", to: student.phone, body });
    await prisma.activityLog.create({
      data: {
        type: "SMS",
        description: `Fee reminder sent for pending amount ${pending}.`,
        studentId,
        createdByUserId: access.user.id,
      },
    });
    revalidatePath("/fees");
    revalidatePath(`/students/${studentId}`);
    return { success: true };
  } catch (error) {
    console.error("Failed to send reminder:", error);
    return { success: false, error: "Could not send reminder." };
  }
}
