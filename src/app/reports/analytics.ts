"use server";

/** Extended analytics for the Reports tabs (comparisons, forecast, boards). */

import { SOURCE_LABELS } from "@/constants/leads";
import { monthLabel } from "@/lib/formatDate";
import { prisma } from "@/lib/prisma";
import { requirePageRole } from "@/lib/session";
import { getReportsData, type ReportFilters, type ReportsData } from "./actions";

export interface AnalyticsData extends ReportsData {
  comparison: {
    leads: number;
    leadsPrev: number;
    students: number;
    studentsPrev: number;
    revenue: number;
    revenuePrev: number;
    weekLeads: number;
    weekLeadsPrev: number;
    weekStudents: number;
    weekStudentsPrev: number;
    weekRevenue: number;
    weekRevenuePrev: number;
  };
  avgDaysToConvert: number | null;
  sourceConversion: { source: string; total: number; converted: number; rate: number }[];
  monthlyRevenue: { name: string; collected: number; pending: number }[];
  forecast: { due: string; amount: number }[];
  enrollments: { name: string; value: number }[];
  batchFill: { batch: string; enrolled: number; fill: number }[];
  dropoutRate: number;
  attendanceTrend: { name: string; present: number; total: number }[];
  counselorBoard: { name: string; assigned: number; converted: number; rate: number; avgHours: number | null }[];
  accountantBoard: { name: string; collections: number; payments: number }[];
}

function monthsBetween(from: Date, to: Date): Date[] {
  const dates: Date[] = [];
  const cursor = new Date(from.getFullYear(), from.getMonth(), 1);
  const end = new Date(to.getFullYear(), to.getMonth(), 1);
  while (cursor <= end) {
    dates.push(new Date(cursor));
    cursor.setMonth(cursor.getMonth() + 1);
  }
  return dates.slice(-8);
}

export async function getAnalyticsData(filters: ReportFilters): Promise<AnalyticsData> {
  await requirePageRole(["ADMIN", "COUNSELOR", "ACCOUNTANT"]);
  const from = new Date(filters.from);
  const to = new Date(filters.to);
  to.setHours(23, 59, 59, 999);
  const span = to.getTime() - from.getTime();
  const prevTo = new Date(from.getTime() - 1);
  const prevFrom = new Date(prevTo.getTime() - span);
  const weekTo = new Date();
  weekTo.setHours(23, 59, 59, 999);
  const weekFrom = new Date(weekTo);
  weekFrom.setDate(weekFrom.getDate() - 6);
  weekFrom.setHours(0, 0, 0, 0);
  const prevWeekTo = new Date(weekFrom.getTime() - 1);
  const prevWeekFrom = new Date(prevWeekTo);
  prevWeekFrom.setDate(prevWeekFrom.getDate() - 6);
  prevWeekFrom.setHours(0, 0, 0, 0);

  const base = await getReportsData(filters);

  const [
    leads,
    leadsPrev,
    students,
    studentsPrev,
    revenue,
    revenuePrev,
    convertedStudents,
    allLeads,
    payments,
    batches,
    dropped,
    studentTotal,
    attendance,
    activities,
    invoices,
    enrollDates,
    weekLeads,
    weekLeadsPrev,
    weekStudents,
    weekStudentsPrev,
    weekRevenue,
    weekRevenuePrev,
  ] = await Promise.all([
    prisma.lead.count({ where: { createdAt: { gte: from, lte: to } } }),
    prisma.lead.count({ where: { createdAt: { gte: prevFrom, lte: prevTo } } }),
    prisma.student.count({ where: { enrollmentDate: { gte: from, lte: to } } }),
    prisma.student.count({ where: { enrollmentDate: { gte: prevFrom, lte: prevTo } } }),
    prisma.payment.aggregate({ where: { paymentDate: { gte: from, lte: to } }, _sum: { amount: true } }),
    prisma.payment.aggregate({ where: { paymentDate: { gte: prevFrom, lte: prevTo } }, _sum: { amount: true } }),
    prisma.student.findMany({
      where: { leadId: { not: null }, enrollmentDate: { gte: from, lte: to } },
      select: { enrollmentDate: true, lead: { select: { createdAt: true } } },
      take: 500,
    }),
    prisma.lead.findMany({
      where: { createdAt: { gte: from, lte: to } },
      select: { source: true, status: true, assignedCounselor: { select: { name: true } }, createdAt: true, id: true },
    }),
    prisma.payment.findMany({
      where: { paymentDate: { gte: from, lte: to } },
      select: { amount: true, paymentDate: true, student: { select: { course: { select: { name: true } } } } },
    }),
    prisma.batch.findMany({
      select: { name: true, _count: { select: { students: true } } },
    }),
    prisma.student.count({ where: { status: "DROPPED" } }),
    prisma.student.count(),
    prisma.attendance.findMany({
      where: { date: { gte: from, lte: to } },
      select: { date: true, status: true },
      take: 4000,
    }),
    prisma.activityLog.findMany({
      where: { leadId: { not: null }, createdAt: { gte: from, lte: to } },
      orderBy: { createdAt: "asc" },
      select: { leadId: true, createdAt: true },
      take: 2000,
    }),
    prisma.invoice.findMany({
      where: { nextDueDate: { not: null } },
      select: { nextDueDate: true, payment: { select: { amount: true, student: { select: { course: { select: { totalFee: true } } } } } } },
      take: 500,
    }),
    prisma.student.findMany({
      where: { enrollmentDate: { gte: from, lte: to } },
      select: { enrollmentDate: true },
    }),
    prisma.lead.count({ where: { createdAt: { gte: weekFrom, lte: weekTo } } }),
    prisma.lead.count({ where: { createdAt: { gte: prevWeekFrom, lte: prevWeekTo } } }),
    prisma.student.count({ where: { enrollmentDate: { gte: weekFrom, lte: weekTo } } }),
    prisma.student.count({ where: { enrollmentDate: { gte: prevWeekFrom, lte: prevWeekTo } } }),
    prisma.payment.aggregate({ where: { paymentDate: { gte: weekFrom, lte: weekTo } }, _sum: { amount: true } }),
    prisma.payment.aggregate({ where: { paymentDate: { gte: prevWeekFrom, lte: prevWeekTo } }, _sum: { amount: true } }),
  ]);

  const days = convertedStudents
    .filter((row) => row.lead)
    .map((row) => (row.enrollmentDate.getTime() - row.lead!.createdAt.getTime()) / 86400000);
  const avgDaysToConvert = days.length ? Math.round(days.reduce((sum, value) => sum + value, 0) / days.length) : null;

  const sourceMap = new Map<string, { total: number; converted: number }>();
  for (const lead of allLeads) {
    const source = SOURCE_LABELS[lead.source];
    const current = sourceMap.get(source) ?? { total: 0, converted: 0 };
    current.total += 1;
    if (lead.status === "CONVERTED") {
      current.converted += 1;
    }
    sourceMap.set(source, current);
  }

  const months = monthsBetween(from, to);
  const monthlyRevenue = months.map((date) => {
    const start = date.getTime();
    const end = new Date(date.getFullYear(), date.getMonth() + 1, 1).getTime();
    const collected = payments
      .filter((payment) => payment.paymentDate.getTime() >= start && payment.paymentDate.getTime() < end)
      .reduce((sum, payment) => sum + payment.amount, 0);
    return { name: monthLabel(date), collected, pending: 0 };
  });
  for (const row of base.revenueByCourse) {
    if (monthlyRevenue[monthlyRevenue.length - 1]) {
      monthlyRevenue[monthlyRevenue.length - 1].pending += row.pending;
    }
  }

  const enrollments = months.map((date) => {
    const start = date.getTime();
    const end = new Date(date.getFullYear(), date.getMonth() + 1, 1).getTime();
    return {
      name: monthLabel(date),
      value: enrollDates.filter((row) => row.enrollmentDate.getTime() >= start && row.enrollmentDate.getTime() < end).length,
    };
  });
  const maxBatch = Math.max(1, ...batches.map((batch) => batch._count.students));

  const firstActivity = new Map<string, Date>();
  for (const activity of activities) {
    if (activity.leadId && !firstActivity.has(activity.leadId)) {
      firstActivity.set(activity.leadId, activity.createdAt);
    }
  }

  const counselorMap = new Map<string, { assigned: number; converted: number; hours: number[] }>();
  for (const lead of allLeads) {
    const name = lead.assignedCounselor?.name ?? "Unassigned";
    const current = counselorMap.get(name) ?? { assigned: 0, converted: 0, hours: [] };
    current.assigned += 1;
    if (lead.status === "CONVERTED") {
      current.converted += 1;
    }
    const first = firstActivity.get(lead.id);
    if (first) {
      current.hours.push((first.getTime() - lead.createdAt.getTime()) / 3600000);
    }
    counselorMap.set(name, current);
  }

  const attendanceMap = new Map<string, { present: number; total: number }>();
  for (const row of attendance) {
    const key = row.date.toISOString().slice(0, 10);
    const current = attendanceMap.get(key) ?? { present: 0, total: 0 };
    current.total += 1;
    if (row.status === "PRESENT" || row.status === "LATE") {
      current.present += 1;
    }
    attendanceMap.set(key, current);
  }

  return {
    ...base,
    comparison: {
      leads,
      leadsPrev,
      students,
      studentsPrev,
      revenue: revenue._sum.amount ?? 0,
      revenuePrev: revenuePrev._sum.amount ?? 0,
      weekLeads,
      weekLeadsPrev,
      weekStudents,
      weekStudentsPrev,
      weekRevenue: weekRevenue._sum.amount ?? 0,
      weekRevenuePrev: weekRevenuePrev._sum.amount ?? 0,
    },
    avgDaysToConvert,
    sourceConversion: Array.from(sourceMap.entries()).map(([source, values]) => ({
      source,
      ...values,
      rate: values.total ? Math.round((values.converted / values.total) * 100) : 0,
    })),
    monthlyRevenue,
    forecast: invoices
      .filter((row) => row.nextDueDate)
      .slice(0, 12)
      .map((row) => ({
        due: row.nextDueDate!.toISOString().slice(0, 10),
        amount: Math.max(0, row.payment.student.course.totalFee - row.payment.amount),
      })),
    enrollments,
    batchFill: batches.map((batch) => ({
      batch: batch.name,
      enrolled: batch._count.students,
      fill: Math.round((batch._count.students / maxBatch) * 100),
    })),
    dropoutRate: studentTotal ? Math.round((dropped / studentTotal) * 100) : 0,
    attendanceTrend: Array.from(attendanceMap.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-14)
      .map(([name, values]) => ({ name: name.slice(5), ...values })),
    counselorBoard: Array.from(counselorMap.entries()).map(([name, values]) => ({
      name,
      assigned: values.assigned,
      converted: values.converted,
      rate: values.assigned ? Math.round((values.converted / values.assigned) * 100) : 0,
      avgHours: values.hours.length
        ? Math.round(values.hours.reduce((sum, value) => sum + value, 0) / values.hours.length)
        : null,
    })),
    accountantBoard: [
      {
        name: "Collections in range",
        collections: revenue._sum.amount ?? 0,
        payments: payments.length,
      },
    ],
  };
}

