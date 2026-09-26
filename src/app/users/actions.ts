"use server";

/** Admin staff accounts: create and activate/deactivate. */

import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireActionRole, requirePageRole } from "@/lib/session";
import type { ActionResult } from "@/types/lead.types";
import type { AppRole } from "@/constants/roles";
import { z } from "zod";

export interface UserRow {
  id: string;
  name: string;
  email: string;
  role: AppRole;
  isActive: boolean;
  createdAt: string;
}

const userSchema = z.object({
  name: z.string().trim().min(1),
  email: z.string().trim().email(),
  password: z.string().min(6),
  role: z.enum(["ADMIN", "COUNSELOR", "ACCOUNTANT", "TEACHER"]),
});

export async function getUsers(): Promise<UserRow[]> {
  await requirePageRole(["ADMIN"]);
  const users = await prisma.user.findMany({ orderBy: { createdAt: "desc" } });
  return users.map((user) => ({
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    isActive: user.isActive,
    createdAt: user.createdAt.toISOString(),
  }));
}

export async function createUser(values: {
  name: string;
  email: string;
  password: string;
  role: AppRole;
}): Promise<ActionResult> {
  const access = await requireActionRole(["ADMIN"]);
  if (!access.ok) {
    return access;
  }
  try {
    const parsed = userSchema.safeParse(values);
    if (!parsed.success) {
      return { success: false, error: "Please fill name, valid email, password (6+), and role." };
    }
    const password = await bcrypt.hash(parsed.data.password, 10);
    await prisma.user.create({
      data: {
        name: parsed.data.name,
        email: parsed.data.email.toLowerCase(),
        password,
        role: parsed.data.role,
      },
    });
    revalidatePath("/settings");
    return { success: true };
  } catch (error) {
    console.error("Failed to create user:", error);
    return { success: false, error: "Could not create user. Email may already exist." };
  }
}

export async function toggleUserActive(id: string, isActive: boolean): Promise<ActionResult> {
  const access = await requireActionRole(["ADMIN"]);
  if (!access.ok) {
    return access;
  }
  try {
    if (id === access.user.id && !isActive) {
      return { success: false, error: "You cannot deactivate your own account." };
    }
    await prisma.user.update({ where: { id }, data: { isActive } });
    revalidatePath("/settings");
    return { success: true };
  } catch (error) {
    console.error("Failed to update user:", error);
    return { success: false, error: "Could not update user." };
  }
}
