"use server";

/** Student document upload/delete under public/uploads. */

import { randomUUID } from "crypto";
import { mkdir, unlink, writeFile } from "fs/promises";
import path from "path";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireActionRole, requirePageRole } from "@/lib/session";
import type { ActionResult } from "@/types/lead.types";

export interface StudentDocumentDto {
  id: string;
  fileName: string;
  fileUrl: string;
  fileType: string;
  uploadedAt: string;
}

const ALLOWED_TYPES = new Set([
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/webp",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
]);

export async function getStudentDocuments(studentId: string): Promise<StudentDocumentDto[]> {
  await requirePageRole(["ADMIN", "COUNSELOR", "ACCOUNTANT", "TEACHER"]);
  const rows = await prisma.studentDocument.findMany({
    where: { studentId },
    orderBy: { uploadedAt: "desc" },
  });
  return rows.map((row) => ({
    id: row.id,
    fileName: row.fileName,
    fileUrl: row.fileUrl,
    fileType: row.fileType,
    uploadedAt: row.uploadedAt.toISOString(),
  }));
}

export async function uploadStudentDocument(formData: FormData): Promise<ActionResult> {
  const access = await requireActionRole(["ADMIN", "COUNSELOR"]);
  if (!access.ok) {
    return access;
  }
  const studentId = String(formData.get("studentId") ?? "");
  const file = formData.get("file");
  if (!studentId || !(file instanceof File) || file.size === 0) {
    return { success: false, error: "Choose a file to upload." };
  }
  if (file.size > 8 * 1024 * 1024) {
    return { success: false, error: "File must be under 8MB." };
  }
  const fileType = file.type || "application/octet-stream";
  if (!ALLOWED_TYPES.has(fileType)) {
    return { success: false, error: "Allowed types: PDF, JPG, PNG, WEBP, DOC, DOCX." };
  }

  try {
    const student = await prisma.student.findUnique({ where: { id: studentId } });
    if (!student) {
      return { success: false, error: "Student not found." };
    }
    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
    const stored = `${randomUUID()}-${safeName}`;
    const dir = path.join(process.cwd(), "public", "uploads", studentId);
    await mkdir(dir, { recursive: true });
    const buffer = Buffer.from(await file.arrayBuffer());
    await writeFile(path.join(dir, stored), buffer);
    const fileUrl = `/uploads/${studentId}/${stored}`;
    await prisma.studentDocument.create({
      data: {
        studentId,
        fileName: file.name,
        fileUrl,
        fileType,
      },
    });
    revalidatePath(`/students/${studentId}`);
    return { success: true };
  } catch (error) {
    console.error("Failed to upload document:", error);
    return { success: false, error: "Could not upload the file." };
  }
}

export async function deleteStudentDocument(id: string): Promise<ActionResult> {
  const access = await requireActionRole(["ADMIN", "COUNSELOR"]);
  if (!access.ok) {
    return access;
  }
  try {
    const doc = await prisma.studentDocument.findUnique({ where: { id } });
    if (!doc) {
      return { success: false, error: "Document not found." };
    }
    const relative = doc.fileUrl.replace(/^\//, "");
    await unlink(path.join(process.cwd(), "public", relative)).catch(() => undefined);
    await prisma.studentDocument.delete({ where: { id } });
    revalidatePath(`/students/${doc.studentId}`);
    return { success: true };
  } catch (error) {
    console.error("Failed to delete document:", error);
    return { success: false, error: "Could not delete the document." };
  }
}
