"use server";

/** Lead CRUD, scoring, assignment, and bulk updates. */

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireActionRole } from "@/lib/session";
import { leadFormSchema, toLeadWriteData } from "@/lib/leadSchema";
import { calculateLeadScore } from "@/lib/leadScore";
import type { ScoreBand } from "@/lib/leadScore";
import { PAGE_SIZE, parseDir, parsePage, skipTake, type PagedResult } from "@/lib/query";
import type { Prisma } from "@prisma/client";
import type { ActionResult, LeadDto } from "@/types/lead.types";
import type { LeadFormValues } from "@/lib/leadSchema";
import type { LeadSourceValue, LeadStatusValue } from "@/constants/leads";

function toLeadDto(lead: {
  id: string;
  name: string;
  phone: string;
  email: string | null;
  source: LeadSourceValue;
  courseInterested: string;
  status: LeadStatusValue;
  notes: string | null;
  nextFollowUpDate: Date | null;
  assignedCounselorId: string | null;
  score: number;
  createdAt: Date;
  updatedAt: Date;
  assignedCounselor?: { name: string } | null;
}): LeadDto {
  return {
    id: lead.id,
    name: lead.name,
    phone: lead.phone,
    email: lead.email,
    source: lead.source,
    courseInterested: lead.courseInterested,
    status: lead.status,
    notes: lead.notes,
    nextFollowUpDate: lead.nextFollowUpDate?.toISOString() ?? null,
    assignedCounselorId: lead.assignedCounselorId,
    assignedCounselorName: lead.assignedCounselor?.name ?? null,
    score: lead.score,
    createdAt: lead.createdAt.toISOString(),
    updatedAt: lead.updatedAt.toISOString(),
  };
}

export async function persistLeadScore(leadId: string): Promise<void> {
  const lead = await prisma.lead.findUnique({
    where: { id: leadId },
    include: { activities: { select: { createdAt: true } } },
  });
  if (!lead) {
    return;
  }
  const lastContactAt = lead.activities.reduce<Date | null>((latest, row) => {
    if (!latest || row.createdAt > latest) {
      return row.createdAt;
    }
    return latest;
  }, null);
  const score = calculateLeadScore({
    source: lead.source,
    activityCount: lead.activities.length,
    lastContactAt,
  });
  if (score !== lead.score) {
    await prisma.lead.update({ where: { id: leadId }, data: { score } });
  }
}

export async function getLeads(): Promise<LeadDto[]> {
  try {
    const leads = await prisma.lead.findMany({
      include: { assignedCounselor: { select: { name: true } } },
      orderBy: { createdAt: "desc" },
      take: 5000,
    });
    return leads.map(toLeadDto);
  } catch (error) {
    console.error("Failed to fetch leads:", error);
    return [];
  }
}

export async function getLeadsPage(input: {
  search?: string;
  status?: string;
  score?: string;
  page?: string;
  sort?: string;
  dir?: string;
}): Promise<PagedResult<LeadDto>> {
  const search = input.search?.trim() ?? "";
  const page = parsePage(input.page);
  const dir = parseDir(input.dir);
  const sort = input.sort || "createdAt";
  const where: Prisma.LeadWhereInput = {};
  if (input.status && input.status !== "ALL") {
    where.status = input.status as LeadStatusValue;
  }
  const score = input.score as ScoreBand | undefined;
  if (score === "HOT") {
    where.score = { gte: 70 };
  } else if (score === "WARM") {
    where.score = { gte: 40, lt: 70 };
  } else if (score === "COLD") {
    where.score = { lt: 40 };
  }
  if (search) {
    where.OR = [
      { name: { contains: search } },
      { phone: { contains: search } },
    ];
  }
  const orderBy: Prisma.LeadOrderByWithRelationInput =
    sort === "name"
      ? { name: dir }
      : sort === "phone"
        ? { phone: dir }
        : sort === "courseInterested"
          ? { courseInterested: dir }
          : sort === "source"
            ? { source: dir }
            : sort === "status"
              ? { status: dir }
              : sort === "score"
                ? { score: dir }
                : { createdAt: dir };

  try {
    const { skip, take } = skipTake(page);
    const [total, leads] = await Promise.all([
      prisma.lead.count({ where }),
      prisma.lead.findMany({
        where,
        include: { assignedCounselor: { select: { name: true } } },
        orderBy,
        skip,
        take,
      }),
    ]);
    return {
      rows: leads.map(toLeadDto),
      total,
      page,
      pageSize: PAGE_SIZE,
      sort,
      dir,
    };
  } catch (error) {
    console.error("Failed to fetch leads page:", error);
    return { rows: [], total: 0, page: 1, pageSize: PAGE_SIZE, sort, dir };
  }
}

export async function getLeadById(id: string): Promise<LeadDto | null> {
  try {
    const lead = await prisma.lead.findUnique({
      where: { id },
      include: { assignedCounselor: { select: { name: true } }, activities: { select: { createdAt: true } } },
    });
    if (!lead) {
      return null;
    }
    await persistLeadScore(lead.id);
    const refreshed = await prisma.lead.findUnique({
      where: { id },
      include: { assignedCounselor: { select: { name: true } } },
    });
    return refreshed ? toLeadDto(refreshed) : null;
  } catch (error) {
    console.error("Failed to load lead:", error);
    return null;
  }
}

export async function updateLeadStatus(
  id: string,
  status: LeadStatusValue
): Promise<ActionResult> {
  const access = await requireActionRole(["ADMIN", "COUNSELOR"]);
  if (!access.ok) {
    return access;
  }
  try {
    await prisma.lead.update({ where: { id }, data: { status } });
    refreshLeadPages();
    revalidatePath(`/leads/${id}`);
    return { success: true };
  } catch (error) {
    console.error("Failed to update lead status:", error);
    return { success: false, error: "Could not update status." };
  }
}

export async function assignLeadCounselor(
  id: string,
  assignedCounselorId: string | null
): Promise<ActionResult> {
  const access = await requireActionRole(["ADMIN", "COUNSELOR"]);
  if (!access.ok) {
    return access;
  }
  try {
    await prisma.lead.update({
      where: { id },
      data: { assignedCounselorId: assignedCounselorId || null },
    });
    revalidatePath(`/leads/${id}`);
    revalidatePath("/leads");
    return { success: true };
  } catch (error) {
    console.error("Failed to assign counselor:", error);
    return { success: false, error: "Could not assign counselor." };
  }
}

function refreshLeadPages(): void {
  revalidatePath("/leads");
  revalidatePath("/");
}

export async function createLead(values: LeadFormValues): Promise<ActionResult> {
  const access = await requireActionRole(["ADMIN", "COUNSELOR"]);
  if (!access.ok) {
    return access;
  }

  try {
    const parsed = leadFormSchema.safeParse(values);
    if (!parsed.success) {
      return { success: false, error: "Please fix the form errors and try again." };
    }

    const created = await prisma.lead.create({ data: toLeadWriteData(parsed.data) });
    await persistLeadScore(created.id);
    refreshLeadPages();
    return { success: true };
  } catch (error) {
    console.error("Failed to create lead:", error);
    return { success: false, error: "Could not create lead. Please try again." };
  }
}

export async function updateLead(
  id: string,
  values: LeadFormValues
): Promise<ActionResult> {
  const access = await requireActionRole(["ADMIN", "COUNSELOR"]);
  if (!access.ok) {
    return access;
  }

  try {
    const parsed = leadFormSchema.safeParse(values);
    if (!parsed.success) {
      return { success: false, error: "Please fix the form errors and try again." };
    }

    await prisma.lead.update({
      where: { id },
      data: toLeadWriteData(parsed.data),
    });
    await persistLeadScore(id);
    refreshLeadPages();
    return { success: true };
  } catch (error) {
    console.error("Failed to update lead:", error);
    return { success: false, error: "Could not update lead. Please try again." };
  }
}

export async function deleteLead(id: string): Promise<ActionResult> {
  const access = await requireActionRole(["ADMIN"]);
  if (!access.ok) {
    return access;
  }

  try {
    const linked = await prisma.student.count({ where: { leadId: id } });
    if (linked > 0) {
      return {
        success: false,
        error: "This lead was converted to a student. Unlink or remove the student first.",
      };
    }
    await prisma.lead.delete({ where: { id } });
    refreshLeadPages();
    return { success: true };
  } catch (error) {
    console.error("Failed to delete lead:", error);
    return { success: false, error: "Could not delete lead. Please try again." };
  }
}

export async function bulkAssignLeads(
  ids: string[],
  assignedCounselorId: string | null
): Promise<ActionResult> {
  const access = await requireActionRole(["ADMIN", "COUNSELOR"]);
  if (!access.ok) {
    return access;
  }
  if (ids.length === 0) {
    return { success: false, error: "Select at least one lead." };
  }
  try {
    await prisma.lead.updateMany({
      where: { id: { in: ids } },
      data: { assignedCounselorId: assignedCounselorId || null },
    });
    refreshLeadPages();
    return { success: true };
  } catch (error) {
    console.error("Failed to bulk assign:", error);
    return { success: false, error: "Could not assign counselor." };
  }
}

export async function bulkUpdateLeadStatus(
  ids: string[],
  status: LeadStatusValue
): Promise<ActionResult> {
  const access = await requireActionRole(["ADMIN", "COUNSELOR"]);
  if (!access.ok) {
    return access;
  }
  if (ids.length === 0) {
    return { success: false, error: "Select at least one lead." };
  }
  try {
    await prisma.lead.updateMany({ where: { id: { in: ids } }, data: { status } });
    refreshLeadPages();
    return { success: true };
  } catch (error) {
    console.error("Failed to bulk update status:", error);
    return { success: false, error: "Could not update status." };
  }
}

export async function bulkDeleteLeads(ids: string[]): Promise<ActionResult> {
  const access = await requireActionRole(["ADMIN"]);
  if (!access.ok) {
    return access;
  }
  if (ids.length === 0) {
    return { success: false, error: "Select at least one lead." };
  }
  try {
    const linked = await prisma.student.count({
      where: { leadId: { in: ids } },
    });
    if (linked > 0) {
      return {
        success: false,
        error: "One or more selected leads are linked to students and cannot be deleted.",
      };
    }
    await prisma.lead.deleteMany({ where: { id: { in: ids } } });
    refreshLeadPages();
    return { success: true };
  } catch (error) {
    console.error("Failed to bulk delete leads:", error);
    return { success: false, error: "Could not delete selected leads." };
  }
}
