"use server";

/** Message templates stored in Settings for the messaging stub. */

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireActionRole, requirePageRole } from "@/lib/session";
import { DEFAULT_MESSAGE_TEMPLATES } from "@/constants/templates";
import type { ActionResult } from "@/types/lead.types";

export interface MessageTemplateDto {
  id: string;
  name: string;
  body: string;
}

export async function getMessageTemplates(): Promise<MessageTemplateDto[]> {
  await requirePageRole(["ADMIN", "COUNSELOR", "ACCOUNTANT", "TEACHER"]);
  const existing = await prisma.messageTemplate.findMany({ orderBy: { name: "asc" } });
  if (existing.length > 0) {
    return existing.map((row) => ({ id: row.id, name: row.name, body: row.body }));
  }

  await prisma.messageTemplate.createMany({ data: DEFAULT_MESSAGE_TEMPLATES });
  const seeded = await prisma.messageTemplate.findMany({ orderBy: { name: "asc" } });
  return seeded.map((row) => ({ id: row.id, name: row.name, body: row.body }));
}

export async function upsertMessageTemplate(input: {
  id?: string;
  name: string;
  body: string;
}): Promise<ActionResult> {
  const access = await requireActionRole(["ADMIN"]);
  if (!access.ok) {
    return access;
  }
  const name = input.name.trim();
  const body = input.body.trim();
  if (!name || !body) {
    return { success: false, error: "Name and message body are required." };
  }
  try {
    if (input.id) {
      await prisma.messageTemplate.update({
        where: { id: input.id },
        data: { name, body },
      });
    } else {
      await prisma.messageTemplate.create({ data: { name, body } });
    }
    revalidatePath("/settings");
    return { success: true };
  } catch (error) {
    console.error("Failed to save template:", error);
    return { success: false, error: "Could not save template." };
  }
}

export async function deleteMessageTemplate(id: string): Promise<ActionResult> {
  const access = await requireActionRole(["ADMIN"]);
  if (!access.ok) {
    return access;
  }
  try {
    await prisma.messageTemplate.delete({ where: { id } });
    revalidatePath("/settings");
    return { success: true };
  } catch (error) {
    console.error("Failed to delete template:", error);
    return { success: false, error: "Could not delete template." };
  }
}
