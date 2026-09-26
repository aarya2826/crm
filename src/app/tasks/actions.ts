"use server";

/** Staff tasks: create, list, complete, and due-today counts. */

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireActionRole, requirePageRole, getSessionUser } from "@/lib/session";
import { taskFormSchema } from "@/lib/taskSchema";
import type { TaskFormValues } from "@/lib/taskSchema";
import type { ActionResult } from "@/types/lead.types";
import type { StaffOption, TaskDto } from "@/types/crm.types";

function toTaskDto(task: {
  id: string;
  title: string;
  dueDate: Date;
  status: "PENDING" | "DONE";
  priority: "LOW" | "MEDIUM" | "HIGH";
  assignedToUserId: string;
  assignedTo: { name: string };
  relatedLeadId: string | null;
  relatedStudentId: string | null;
  relatedLead: { name: string } | null;
  relatedStudent: { name: string } | null;
}): TaskDto {
  return {
    id: task.id,
    title: task.title,
    dueDate: task.dueDate.toISOString(),
    status: task.status,
    priority: task.priority,
    assignedToUserId: task.assignedToUserId,
    assignedToName: task.assignedTo.name,
    relatedLeadId: task.relatedLeadId,
    relatedLeadName: task.relatedLead?.name ?? null,
    relatedStudentId: task.relatedStudentId,
    relatedStudentName: task.relatedStudent?.name ?? null,
  };
}

const includeTask = {
  assignedTo: { select: { name: true } },
  relatedLead: { select: { name: true } },
  relatedStudent: { select: { name: true } },
} as const;

export async function getStaffOptions(): Promise<StaffOption[]> {
  const users = await prisma.user.findMany({
    where: { isActive: true },
    orderBy: { name: "asc" },
    select: { id: true, name: true, role: true },
  });
  return users;
}

export async function getMyTasks(): Promise<TaskDto[]> {
  const user = await requirePageRole(["ADMIN", "COUNSELOR", "ACCOUNTANT", "TEACHER"]);
  const tasks = await prisma.task.findMany({
    where: user.role === "ADMIN" ? {} : { assignedToUserId: user.id },
    include: includeTask,
    orderBy: { dueDate: "asc" },
    take: 500,
  });
  return tasks.map(toTaskDto);
}

export async function getTasksForRecord(params: {
  leadId?: string;
  studentId?: string;
}): Promise<TaskDto[]> {
  const tasks = await prisma.task.findMany({
    where: params.leadId ? { relatedLeadId: params.leadId } : { relatedStudentId: params.studentId },
    include: includeTask,
    orderBy: { dueDate: "asc" },
  });
  return tasks.map(toTaskDto);
}

export async function getTasksDueTodayCount(): Promise<number> {
  const user = await getSessionUser();
  if (!user) {
    return 0;
  }
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setDate(end.getDate() + 1);
  return prisma.task.count({
    where: {
      assignedToUserId: user.id,
      status: "PENDING",
      dueDate: { gte: start, lt: end },
    },
  });
}

export async function createTask(values: TaskFormValues): Promise<ActionResult> {
  const access = await requireActionRole(["ADMIN", "COUNSELOR", "ACCOUNTANT", "TEACHER"]);
  if (!access.ok) {
    return access;
  }
  try {
    const parsed = taskFormSchema.safeParse(values);
    if (!parsed.success) {
      return { success: false, error: "Please fix the form errors and try again." };
    }
    await prisma.task.create({
      data: {
        title: parsed.data.title.trim(),
        dueDate: new Date(parsed.data.dueDate),
        priority: parsed.data.priority,
        assignedToUserId: parsed.data.assignedToUserId,
        relatedLeadId: parsed.data.relatedLeadId || null,
        relatedStudentId: parsed.data.relatedStudentId || null,
      },
    });
    revalidatePath("/tasks");
    revalidatePath("/");
    if (parsed.data.relatedLeadId) {
      revalidatePath(`/leads/${parsed.data.relatedLeadId}`);
    }
    if (parsed.data.relatedStudentId) {
      revalidatePath(`/students/${parsed.data.relatedStudentId}`);
    }
    return { success: true };
  } catch (error) {
    console.error("Failed to create task:", error);
    return { success: false, error: "Could not create task." };
  }
}

export async function completeTask(id: string): Promise<ActionResult> {
  const access = await requireActionRole(["ADMIN", "COUNSELOR", "ACCOUNTANT", "TEACHER"]);
  if (!access.ok) {
    return access;
  }
  try {
    const task = await prisma.task.findUnique({ where: { id } });
    if (!task) {
      return { success: false, error: "Task not found." };
    }
    if (access.user.role !== "ADMIN" && task.assignedToUserId !== access.user.id) {
      return { success: false, error: "You can only complete your own tasks." };
    }
    await prisma.task.update({ where: { id }, data: { status: "DONE" } });
    revalidatePath("/tasks");
    revalidatePath("/");
    return { success: true };
  } catch (error) {
    console.error("Failed to complete task:", error);
    return { success: false, error: "Could not update task." };
  }
}
