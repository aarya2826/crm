"use server";

/** Activity timeline reads and log-activity writes. */

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireActionRole } from "@/lib/session";
import { activityFormSchema } from "@/lib/activitySchema";
import type { ActivityFormValues } from "@/lib/activitySchema";
import type { ActionResult } from "@/types/lead.types";
import type { ActivityDto } from "@/types/crm.types";

export async function getActivities(params: {
  leadId?: string;
  studentId?: string;
}): Promise<ActivityDto[]> {
  const rows = await prisma.activityLog.findMany({
    where: params.leadId ? { leadId: params.leadId } : { studentId: params.studentId },
    include: { createdBy: { select: { name: true } } },
    orderBy: { createdAt: "desc" },
  });
  return rows.map((row) => ({
    id: row.id,
    type: row.type,
    description: row.description,
    createdAt: row.createdAt.toISOString(),
    createdByName: row.createdBy.name,
  }));
}

export async function logActivity(values: ActivityFormValues): Promise<ActionResult> {
  const access = await requireActionRole(["ADMIN", "COUNSELOR", "ACCOUNTANT", "TEACHER"]);
  if (!access.ok) {
    return access;
  }
  try {
    const parsed = activityFormSchema.safeParse(values);
    if (!parsed.success) {
      return { success: false, error: "Please add a description." };
    }
    if (!parsed.data.leadId && !parsed.data.studentId) {
      return { success: false, error: "Activity must be linked to a lead or student." };
    }
    await prisma.activityLog.create({
      data: {
        type: parsed.data.type,
        description: parsed.data.description.trim(),
        leadId: parsed.data.leadId || null,
        studentId: parsed.data.studentId || null,
        createdByUserId: access.user.id,
      },
    });
    if (parsed.data.leadId) {
      const { persistLeadScore } = await import("@/app/leads/actions");
      await persistLeadScore(parsed.data.leadId);
      revalidatePath(`/leads/${parsed.data.leadId}`);
      revalidatePath("/leads");
      revalidatePath("/");
    }
    if (parsed.data.studentId) {
      revalidatePath(`/students/${parsed.data.studentId}`);
    }
    return { success: true };
  } catch (error) {
    console.error("Failed to log activity:", error);
    return { success: false, error: "Could not save activity." };
  }
}
