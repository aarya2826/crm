"use server";

/** Logs a templated message; delivery is a console stub, not a real SMS/email API. */

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireActionRole } from "@/lib/session";
import { sendMessage } from "@/lib/messaging";
import type { ActionResult } from "@/types/lead.types";

export async function sendTemplatedMessage(input: {
  leadId?: string;
  studentId?: string;
  channel: "EMAIL" | "SMS";
  body: string;
}): Promise<ActionResult> {
  const access = await requireActionRole(["ADMIN", "COUNSELOR", "ACCOUNTANT", "TEACHER"]);
  if (!access.ok) {
    return access;
  }
  const body = input.body.trim();
  if (!body) {
    return { success: false, error: "Message cannot be empty." };
  }
  if (!input.leadId && !input.studentId) {
    return { success: false, error: "Pick a lead or student." };
  }

  try {
    const lead = input.leadId
      ? await prisma.lead.findUnique({ where: { id: input.leadId } })
      : null;
    const student = input.studentId
      ? await prisma.student.findUnique({ where: { id: input.studentId } })
      : null;
    const to = student?.phone || lead?.phone || student?.email || lead?.email || "unknown";
    sendMessage({ channel: input.channel, to, body });
    await prisma.activityLog.create({
      data: {
        type: input.channel,
        description: `Message sent (${input.channel}): ${body}`,
        leadId: input.leadId || null,
        studentId: input.studentId || null,
        createdByUserId: access.user.id,
      },
    });
    if (input.leadId) {
      const { persistLeadScore } = await import("@/app/leads/actions");
      await persistLeadScore(input.leadId);
      revalidatePath(`/leads/${input.leadId}`);
      revalidatePath("/leads");
      revalidatePath("/");
    }
    if (input.studentId) {
      revalidatePath(`/students/${input.studentId}`);
    }
    return { success: true };
  } catch (error) {
    console.error("Failed to send message:", error);
    return { success: false, error: "Could not log the message." };
  }
}
