/** Dashboard KPI aggregates, sparklines, follow-ups, and chart series. */
import type { LeadSourceValue, LeadStatusValue } from "@/constants/leads";
import {
  SOURCE_CHART_COLORS,
  SOURCE_LABELS,
  STATUS_CHART_COLORS,
  STATUS_LABELS,
} from "@/constants/leads";
import { monthLabel } from "@/lib/formatDate";
import { prisma } from "@/lib/prisma";

export interface ChartDatum {
  name: string;
  value: number;
  fill?: string;
}

export type ActivityType = "lead" | "student" | "payment";

export interface ActivityItem {
  id: string;
  type: ActivityType;
  title: string;
  at: string;
  href: string;
}

export interface FollowUpItem {
  id: string;
  name: string;
  phone: string;
  status: LeadStatusValue;
  nextFollowUpDate: string;
}

export interface HotLeadItem {
  id: string;
  name: string;
  phone: string;
  status: LeadStatusValue;
  score: number;
}

export interface KpiTrend {
  percent: number;
  sparkline: number[];
}

export interface DashboardData {
  totalLeads: number;
  activeStudents: number;
  feesThisMonth: number;
  pendingDues: number;
  leadTrend: KpiTrend;
  studentTrend: KpiTrend;
  feeTrend: KpiTrend;
  duesTrend: KpiTrend;
  leadsByStatus: ChartDatum[];
  leadsBySource: ChartDatum[];
  feesByMonth: ChartDatum[];
  recentActivity: ActivityItem[];
  todaysFollowUps: FollowUpItem[];
  hotLeads: HotLeadItem[];
}

export async function getDashboardData(): Promise<DashboardData> {
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
  const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1);
  const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);

  const [
    totalLeads,
    activeStudents,
    statusGroups,
    sourceGroups,
    monthSum,
    followUps,
    hotLeads,
    recentLeads,
    recentStudents,
    recentPayments,
    studentsForDues,
    monthPayments,
    leadsThisMonth,
    leadsLastMonth,
    studentsThisMonth,
    studentsLastMonth,
    feesLastMonth,
    leadDates,
    studentDates,
  ] = await Promise.all([
    prisma.lead.count(),
    prisma.student.count({ where: { status: "ACTIVE" } }),
    prisma.lead.groupBy({ by: ["status"], _count: { _all: true } }),
    prisma.lead.groupBy({ by: ["source"], _count: { _all: true } }),
    prisma.payment.aggregate({
      where: { paymentDate: { gte: monthStart, lt: monthEnd } },
      _sum: { amount: true },
    }),
    prisma.lead.findMany({
      where: { nextFollowUpDate: { gte: todayStart, lt: todayEnd } },
      orderBy: { nextFollowUpDate: "asc" },
      take: 20,
      select: { id: true, name: true, phone: true, status: true, nextFollowUpDate: true },
    }),
    prisma.lead.findMany({
      where: { status: { in: ["NEW", "CONTACTED", "FOLLOW_UP", "INTERESTED"] } },
      orderBy: { score: "desc" },
      take: 5,
      select: { id: true, name: true, phone: true, status: true, score: true },
    }),
    prisma.lead.findMany({
      orderBy: { createdAt: "desc" },
      take: 10,
      select: { id: true, name: true, createdAt: true },
    }),
    prisma.student.findMany({
      orderBy: { createdAt: "desc" },
      take: 10,
      select: { id: true, name: true, leadId: true, createdAt: true },
    }),
    prisma.payment.findMany({
      orderBy: { createdAt: "desc" },
      take: 10,
      select: { id: true, createdAt: true, student: { select: { name: true } } },
    }),
    prisma.student.findMany({
      select: {
        course: {
          select: {
            totalFee: true,
            feeStructures: { orderBy: { createdAt: "desc" }, take: 1, select: { totalAmount: true } },
          },
        },
        payments: { select: { amount: true } },
      },
    }),
    prisma.payment.findMany({
      where: { paymentDate: { gte: sixMonthsAgo } },
      select: { amount: true, paymentDate: true },
    }),
    prisma.lead.count({ where: { createdAt: { gte: monthStart, lt: monthEnd } } }),
    prisma.lead.count({ where: { createdAt: { gte: lastMonthStart, lt: monthStart } } }),
    prisma.student.count({ where: { enrollmentDate: { gte: monthStart, lt: monthEnd } } }),
    prisma.student.count({ where: { enrollmentDate: { gte: lastMonthStart, lt: monthStart } } }),
    prisma.payment.aggregate({
      where: { paymentDate: { gte: lastMonthStart, lt: monthStart } },
      _sum: { amount: true },
    }),
    prisma.lead.findMany({
      where: { createdAt: { gte: sixMonthsAgo } },
      select: { createdAt: true },
    }),
    prisma.student.findMany({
      where: { enrollmentDate: { gte: sixMonthsAgo } },
      select: { enrollmentDate: true },
    }),
  ]);

  const statusCounts = new Map<LeadStatusValue, number>();
  for (const row of statusGroups) {
    statusCounts.set(row.status, row._count._all);
  }
  const sourceCounts = new Map<LeadSourceValue, number>();
  for (const row of sourceGroups) {
    sourceCounts.set(row.source, row._count._all);
  }

  const pendingDues = studentsForDues.reduce((sum, student) => {
    const totalFee = student.course.feeStructures[0]?.totalAmount ?? student.course.totalFee;
    const paid = student.payments.reduce((inner, payment) => inner + payment.amount, 0);
    return sum + Math.max(0, totalFee - paid);
  }, 0);

  const monthBuckets = (items: Date[]): number[] => {
    const values: number[] = [];
    for (let index = 5; index >= 0; index -= 1) {
      const start = new Date(now.getFullYear(), now.getMonth() - index, 1).getTime();
      const end = new Date(now.getFullYear(), now.getMonth() - index + 1, 1).getTime();
      values.push(items.filter((date) => date.getTime() >= start && date.getTime() < end).length);
    }
    return values;
  };

  const trendPercent = (current: number, previous: number): number => {
    if (previous <= 0) {
      return current > 0 ? 100 : 0;
    }
    return Math.round(((current - previous) / previous) * 100);
  };

  const feesThisMonth = monthSum._sum.amount ?? 0;
  const feesPrevMonth = feesLastMonth._sum.amount ?? 0;

  const feesByMonth: ChartDatum[] = [];
  const feeSpark: number[] = [];
  for (let index = 5; index >= 0; index -= 1) {
    const date = new Date(now.getFullYear(), now.getMonth() - index, 1);
    const start = date.getTime();
    const end = new Date(now.getFullYear(), now.getMonth() - index + 1, 1).getTime();
    const amount = monthPayments
      .filter((payment) => {
        const time = payment.paymentDate.getTime();
        return time >= start && time < end;
      })
      .reduce((sum, payment) => sum + payment.amount, 0);
    feesByMonth.push({ name: monthLabel(date), value: amount });
    feeSpark.push(amount);
  }

  const recentActivity: ActivityItem[] = [
    ...recentLeads.map((lead) => ({
      id: `lead-${lead.id}`,
      type: "lead" as const,
      title: `New lead: ${lead.name}`,
      at: lead.createdAt.toISOString(),
      href: "/leads",
    })),
    ...recentStudents.map((student) => ({
      id: `student-${student.id}`,
      type: "student" as const,
      title: student.leadId ? `Student converted: ${student.name}` : `New student: ${student.name}`,
      at: student.createdAt.toISOString(),
      href: "/students",
    })),
    ...recentPayments.map((payment) => ({
      id: `payment-${payment.id}`,
      type: "payment" as const,
      title: `Payment recorded: ${payment.student.name}`,
      at: payment.createdAt.toISOString(),
      href: "/fees",
    })),
  ]
    .sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime())
    .slice(0, 10);

  return {
    totalLeads,
    activeStudents,
    feesThisMonth,
    pendingDues,
    leadTrend: { percent: trendPercent(leadsThisMonth, leadsLastMonth), sparkline: monthBuckets(leadDates.map((row) => row.createdAt)) },
    studentTrend: {
      percent: trendPercent(studentsThisMonth, studentsLastMonth),
      sparkline: monthBuckets(studentDates.map((row) => row.enrollmentDate)),
    },
    feeTrend: { percent: trendPercent(feesThisMonth, feesPrevMonth), sparkline: feeSpark },
    duesTrend: { percent: trendPercent(feesPrevMonth, feesThisMonth), sparkline: feeSpark },
    leadsByStatus: (Object.keys(STATUS_LABELS) as LeadStatusValue[]).map((status) => ({
      name: STATUS_LABELS[status],
      value: statusCounts.get(status) ?? 0,
      fill: STATUS_CHART_COLORS[status],
    })),
    leadsBySource: (Object.keys(SOURCE_LABELS) as LeadSourceValue[]).map((source) => ({
      name: SOURCE_LABELS[source],
      value: sourceCounts.get(source) ?? 0,
      fill: SOURCE_CHART_COLORS[source],
    })),
    feesByMonth,
    recentActivity,
    todaysFollowUps: followUps.map((lead) => ({
      id: lead.id,
      name: lead.name,
      phone: lead.phone,
      status: lead.status,
      nextFollowUpDate: lead.nextFollowUpDate?.toISOString() ?? "",
    })),
    hotLeads,
  };
}
