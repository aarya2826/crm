"use server";

/** In-app notifications (overdue tasks, unpaid fees). */

import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/session";
import type { NotificationDto } from "@/types/crm.types";

function dayStart(offset = 0): Date {
  const date = new Date();
  date.setHours(0, 0, 0, 0);
  date.setDate(date.getDate() + offset);
  return date;
}

async function syncNotifications(userId: string, role: string): Promise<void> {
  const today = dayStart();
  const tomorrow = dayStart(1);
  const staleBefore = dayStart(-3);

  const dueTasks = await prisma.task.findMany({
    where: { assignedToUserId: userId, status: "PENDING", dueDate: { gte: today, lt: tomorrow } },
  });

  for (const task of dueTasks) {
    await prisma.notification.upsert({
      where: { dedupeKey: `task-due-${userId}-${task.id}-${today.toISOString().slice(0, 10)}` },
      update: {},
      create: {
        userId,
        title: "Task due today",
        message: task.title,
        href: "/tasks",
        dedupeKey: `task-due-${userId}-${task.id}-${today.toISOString().slice(0, 10)}`,
      },
    });
  }

  if (role === "ADMIN" || role === "ACCOUNTANT") {
    const students = await prisma.student.findMany({
      include: {
        course: { include: { feeStructures: { orderBy: { createdAt: "desc" }, take: 1 } } },
        payments: { select: { amount: true } },
      },
    });
    for (const student of students) {
      const total = student.course.feeStructures[0]?.totalAmount ?? student.course.totalFee;
      const paid = student.payments.reduce((sum, payment) => sum + payment.amount, 0);
      if (paid < total) {
        const key = `fee-overdue-${userId}-${student.id}`;
        await prisma.notification.upsert({
          where: { dedupeKey: key },
          update: {},
          create: {
            userId,
            title: "Fee pending",
            message: `${student.name} still has dues`,
            href: `/students/${student.id}`,
            dedupeKey: key,
          },
        });
      }
    }
  }

  if (role === "ADMIN" || role === "COUNSELOR") {
    const leads = await prisma.lead.findMany({
      where: { status: { notIn: ["CONVERTED", "LOST"] }, createdAt: { lte: staleBefore } },
      include: { activities: { orderBy: { createdAt: "desc" }, take: 1 } },
    });
    for (const lead of leads) {
      const last = lead.activities[0]?.createdAt ?? lead.updatedAt;
      if (last <= staleBefore) {
        const key = `lead-stale-${userId}-${lead.id}`;
        await prisma.notification.upsert({
          where: { dedupeKey: key },
          update: {},
          create: {
            userId,
            title: "Lead needs follow-up",
            message: `${lead.name} has had no activity in 3+ days`,
            href: `/leads/${lead.id}`,
            dedupeKey: key,
          },
        });
      }
    }
  }
}

export async function getNotifications(): Promise<NotificationDto[]> {
  const user = await getSessionUser();
  if (!user) {
    return [];
  }
  try {
    await syncNotifications(user.id, user.role);
    const rows = await prisma.notification.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      take: 20,
    });
    return rows.map((row) => ({
      id: row.id,
      title: row.title,
      message: row.message,
      href: row.href,
      readAt: row.readAt?.toISOString() ?? null,
      createdAt: row.createdAt.toISOString(),
    }));
  } catch (error) {
    console.error("Failed to load notifications:", error);
    return [];
  }
}

export async function markNotificationRead(id: string): Promise<void> {
  const user = await getSessionUser();
  if (!user) {
    return;
  }
  await prisma.notification.updateMany({
    where: { id, userId: user.id, readAt: null },
    data: { readAt: new Date() },
  });
}
