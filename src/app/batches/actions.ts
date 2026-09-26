"use server";

/** Batch CRUD. Delete is blocked while students are enrolled. */

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireActionRole } from "@/lib/session";
import { batchFormSchema } from "@/lib/batchSchema";
import type { BatchFormValues } from "@/lib/batchSchema";
import type { BatchDto } from "@/types/academic.types";
import type { ActionResult } from "@/types/lead.types";

function toBatchDto(batch: {
  id: string;
  name: string;
  courseId: string;
  startDate: Date;
  timing: string;
  createdAt: Date;
  course: { name: string };
}): BatchDto {
  return {
    id: batch.id,
    name: batch.name,
    courseId: batch.courseId,
    courseName: batch.course.name,
    startDate: batch.startDate.toISOString(),
    timing: batch.timing,
    createdAt: batch.createdAt.toISOString(),
  };
}

function refreshBatchPages(): void {
  revalidatePath("/batches");
  revalidatePath("/students");
  revalidatePath("/leads");
  revalidatePath("/");
}

export async function getBatches(): Promise<BatchDto[]> {
  try {
    const batches = await prisma.batch.findMany({
      include: { course: true },
      orderBy: { createdAt: "desc" },
    });
    return batches.map(toBatchDto);
  } catch (error) {
    console.error("Failed to fetch batches:", error);
    return [];
  }
}

export async function createBatch(values: BatchFormValues): Promise<ActionResult> {
  const access = await requireActionRole(["ADMIN"]);
  if (!access.ok) {
    return access;
  }

  try {
    const parsed = batchFormSchema.safeParse(values);
    if (!parsed.success) {
      return { success: false, error: "Please fix the form errors and try again." };
    }

    await prisma.batch.create({
      data: {
        name: parsed.data.name.trim(),
        courseId: parsed.data.courseId,
        startDate: new Date(parsed.data.startDate),
        timing: parsed.data.timing.trim(),
      },
    });
    refreshBatchPages();
    return { success: true };
  } catch (error) {
    console.error("Failed to create batch:", error);
    return { success: false, error: "Could not create batch. Please try again." };
  }
}

export async function updateBatch(
  id: string,
  values: BatchFormValues
): Promise<ActionResult> {
  const access = await requireActionRole(["ADMIN"]);
  if (!access.ok) {
    return access;
  }

  try {
    const parsed = batchFormSchema.safeParse(values);
    if (!parsed.success) {
      return { success: false, error: "Please fix the form errors and try again." };
    }

    await prisma.batch.update({
      where: { id },
      data: {
        name: parsed.data.name.trim(),
        courseId: parsed.data.courseId,
        startDate: new Date(parsed.data.startDate),
        timing: parsed.data.timing.trim(),
      },
    });
    refreshBatchPages();
    return { success: true };
  } catch (error) {
    console.error("Failed to update batch:", error);
    return { success: false, error: "Could not update batch. Please try again." };
  }
}

export async function deleteBatch(id: string): Promise<ActionResult> {
  const access = await requireActionRole(["ADMIN"]);
  if (!access.ok) {
    return access;
  }

  try {
    const students = await prisma.student.count({ where: { batchId: id } });
    if (students > 0) {
      return {
        success: false,
        error: `This batch still has ${students} student(s). Move them to another batch first.`,
      };
    }
    await prisma.batch.delete({ where: { id } });
    refreshBatchPages();
    return { success: true };
  } catch (error) {
    console.error("Failed to delete batch:", error);
    return {
      success: false,
      error: "Could not delete batch. Remove linked students first.",
    };
  }
}
