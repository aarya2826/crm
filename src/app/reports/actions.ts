"use server";

/** Core report aggregates (funnel, revenue by course, counselor table). */

import { prisma } from "@/lib/prisma";
import { requirePageRole } from "@/lib/session";

export interface ReportFilters {
  from: string;
  to: string;
}

export interface ReportsData {
  funnel: { name: string; value: number }[];
  revenueByCourse: { course: string; collected: number; pending: number }[];
  staffPerformance: { name: string; assigned: number; converted: number }[];
}

export async function getReportsData(filters: ReportFilters): Promise<ReportsData> {
  await requirePageRole(["ADMIN", "COUNSELOR", "ACCOUNTANT"]);
  const from = new Date(filters.from);
  const to = new Date(filters.to);
  to.setHours(23, 59, 59, 999);

  const [statusGroups, leads, students, payments] = await Promise.all([
    prisma.lead.groupBy({ by: ["status"], where: { createdAt: { gte: from, lte: to } }, _count: { _all: true } }),
    prisma.lead.findMany({
      where: { createdAt: { gte: from, lte: to } },
      select: { status: true, assignedCounselor: { select: { name: true } } },
    }),
    prisma.student.findMany({
      select: {
        course: {
          select: {
            name: true,
            totalFee: true,
            feeStructures: { orderBy: { createdAt: "desc" }, take: 1, select: { totalAmount: true } },
          },
        },
        payments: { select: { amount: true } },
      },
    }),
    prisma.payment.findMany({
      where: { paymentDate: { gte: from, lte: to } },
      select: { amount: true, student: { select: { course: { select: { name: true } } } } },
    }),
  ]);

  const funnelOrder = ["NEW", "CONTACTED", "INTERESTED", "CONVERTED"] as const;
  const funnel = funnelOrder.map((status) => ({
    name: status === "NEW" ? "New" : status === "CONTACTED" ? "Contacted" : status === "INTERESTED" ? "Interested" : "Converted",
    value: statusGroups.find((row) => row.status === status)?._count._all ?? 0,
  }));

  const revenueMap = new Map<string, { collected: number; pending: number }>();
  for (const student of students) {
    const course = student.course.name;
    const total = student.course.feeStructures[0]?.totalAmount ?? student.course.totalFee;
    const paidAll = student.payments.reduce((sum, payment) => sum + payment.amount, 0);
    const current = revenueMap.get(course) ?? { collected: 0, pending: 0 };
    current.pending += Math.max(0, total - paidAll);
    revenueMap.set(course, current);
  }
  for (const payment of payments) {
    const course = payment.student.course.name;
    const current = revenueMap.get(course) ?? { collected: 0, pending: 0 };
    current.collected += payment.amount;
    revenueMap.set(course, current);
  }

  const staffMap = new Map<string, { assigned: number; converted: number }>();
  for (const lead of leads) {
    const name = lead.assignedCounselor?.name ?? "Unassigned";
    const current = staffMap.get(name) ?? { assigned: 0, converted: 0 };
    current.assigned += 1;
    if (lead.status === "CONVERTED") {
      current.converted += 1;
    }
    staffMap.set(name, current);
  }

  return {
    funnel,
    revenueByCourse: Array.from(revenueMap.entries()).map(([course, values]) => ({ course, ...values })),
    staffPerformance: Array.from(staffMap.entries()).map(([name, values]) => ({ name, ...values })),
  };
}
