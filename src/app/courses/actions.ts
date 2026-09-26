"use server";

/** Course catalog and linked fee-structure create/update/delete. */

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireActionRole } from "@/lib/session";
import { courseFormSchema } from "@/lib/courseSchema";
import type { CourseFormValues } from "@/lib/courseSchema";
import type { CourseDto } from "@/types/academic.types";
import type { ActionResult } from "@/types/lead.types";

function toCourseDto(course: {
  id: string;
  name: string;
  duration: string;
  totalFee: number;
  createdAt: Date;
}): CourseDto {
  return {
    id: course.id,
    name: course.name,
    duration: course.duration,
    totalFee: course.totalFee,
    createdAt: course.createdAt.toISOString(),
  };
}

function refreshCoursePages(): void {
  revalidatePath("/courses");
  revalidatePath("/batches");
  revalidatePath("/students");
  revalidatePath("/leads");
  revalidatePath("/fees");
  revalidatePath("/");
}

export async function getCourses(): Promise<CourseDto[]> {
  try {
    const courses = await prisma.course.findMany({
      orderBy: { createdAt: "desc" },
    });
    return courses.map(toCourseDto);
  } catch (error) {
    console.error("Failed to fetch courses:", error);
    return [];
  }
}

export async function createCourse(values: CourseFormValues): Promise<ActionResult> {
  const access = await requireActionRole(["ADMIN"]);
  if (!access.ok) {
    return access;
  }

  try {
    const parsed = courseFormSchema.safeParse(values);
    if (!parsed.success) {
      return { success: false, error: "Please fix the form errors and try again." };
    }

    await prisma.course.create({
      data: {
        ...parsed.data,
        feeStructures: {
          create: {
            totalAmount: parsed.data.totalFee,
            numberOfInstallments: 3,
          },
        },
      },
    });
    refreshCoursePages();
    return { success: true };
  } catch (error) {
    console.error("Failed to create course:", error);
    return { success: false, error: "Could not create course. Please try again." };
  }
}

export async function updateCourse(
  id: string,
  values: CourseFormValues
): Promise<ActionResult> {
  const access = await requireActionRole(["ADMIN"]);
  if (!access.ok) {
    return access;
  }

  try {
    const parsed = courseFormSchema.safeParse(values);
    if (!parsed.success) {
      return { success: false, error: "Please fix the form errors and try again." };
    }

    await prisma.course.update({ where: { id }, data: parsed.data });
    await prisma.feeStructure.updateMany({
      where: { courseId: id },
      data: { totalAmount: parsed.data.totalFee },
    });
    refreshCoursePages();
    return { success: true };
  } catch (error) {
    console.error("Failed to update course:", error);
    return { success: false, error: "Could not update course. Please try again." };
  }
}

export async function deleteCourse(id: string): Promise<ActionResult> {
  const access = await requireActionRole(["ADMIN"]);
  if (!access.ok) {
    return access;
  }

  try {
    const [batches, students] = await Promise.all([
      prisma.batch.count({ where: { courseId: id } }),
      prisma.student.count({ where: { courseId: id } }),
    ]);
    if (batches > 0 || students > 0) {
      return {
        success: false,
        error: `This course still has ${batches} batch(es) and ${students} student(s). Reassign or remove them first.`,
      };
    }
    await prisma.course.delete({ where: { id } });
    refreshCoursePages();
    return { success: true };
  } catch (error) {
    console.error("Failed to delete course:", error);
    return {
      success: false,
      error: "Could not delete course. Remove linked batches and students first.",
    };
  }
}
