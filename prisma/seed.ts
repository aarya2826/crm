import { Prisma, PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const SOURCES = ["WEBSITE", "REFERRAL", "WALK_IN", "SOCIAL_MEDIA"] as const;
const STATUSES = ["NEW", "CONTACTED", "FOLLOW_UP", "INTERESTED", "CONVERTED", "LOST"] as const;
const MODES = ["CASH", "UPI", "CARD", "BANK_TRANSFER"] as const;

async function main(): Promise<void> {
  const password = await bcrypt.hash("Admin@123", 10);
  const staffPassword = await bcrypt.hash("Staff@123", 10);

  const admin = await prisma.user.upsert({
    where: { email: "admin@institute.com" },
    update: {},
    create: {
      name: "Admin User",
      email: "admin@institute.com",
      password,
      role: "ADMIN",
    },
  });

  const counselor = await prisma.user.upsert({
    where: { email: "counselor@institute.com" },
    update: {},
    create: {
      name: "Riya Counselor",
      email: "counselor@institute.com",
      password: staffPassword,
      role: "COUNSELOR",
    },
  });

  await prisma.user.upsert({
    where: { email: "accountant@institute.com" },
    update: {},
    create: {
      name: "Aman Accounts",
      email: "accountant@institute.com",
      password: staffPassword,
      role: "ACCOUNTANT",
    },
  });

  await prisma.user.upsert({
    where: { email: "teacher@institute.com" },
    update: {},
    create: {
      name: "Neha Teacher",
      email: "teacher@institute.com",
      password: staffPassword,
      role: "TEACHER",
    },
  });

  const courseA = await prisma.course.upsert({
    where: { id: "seed-course-web" },
    update: {},
    create: {
      id: "seed-course-web",
      name: "Full Stack Web",
      duration: "6 months",
      totalFee: 40000,
    },
  });
  const courseB = await prisma.course.upsert({
    where: { id: "seed-course-data" },
    update: {},
    create: {
      id: "seed-course-data",
      name: "Data Analytics",
      duration: "4 months",
      totalFee: 32000,
    },
  });

  const existingFeeA = await prisma.feeStructure.findFirst({ where: { courseId: courseA.id } });
  if (!existingFeeA) {
    await prisma.feeStructure.create({
      data: { courseId: courseA.id, totalAmount: 40000, numberOfInstallments: 4 },
    });
  }
  const existingFeeB = await prisma.feeStructure.findFirst({ where: { courseId: courseB.id } });
  if (!existingFeeB) {
    await prisma.feeStructure.create({
      data: { courseId: courseB.id, totalAmount: 32000, numberOfInstallments: 4 },
    });
  }

  const batchA = await prisma.batch.upsert({
    where: { id: "seed-batch-web-a" },
    update: {},
    create: {
      id: "seed-batch-web-a",
      name: "Web Morning",
      courseId: courseA.id,
      startDate: new Date("2025-01-15"),
      timing: "10:00 AM",
    },
  });
  const batchB = await prisma.batch.upsert({
    where: { id: "seed-batch-data-a" },
    update: {},
    create: {
      id: "seed-batch-data-a",
      name: "Analytics Evening",
      courseId: courseB.id,
      startDate: new Date("2025-02-01"),
      timing: "6:00 PM",
    },
  });

  const leadCount = await prisma.lead.count();
  if (leadCount < 200) {
    const remaining = 200 - leadCount;
    await prisma.lead.createMany({
      data: Array.from({ length: remaining }, (_, index) => {
        const n = leadCount + index + 1;
        return {
          name: `Lead ${n}`,
          phone: `98${String(10000000 + n).slice(-8)}`,
          email: `lead${n}@example.com`,
          source: SOURCES[n % SOURCES.length],
          courseInterested: n % 2 === 0 ? courseA.name : courseB.name,
          status: STATUSES[n % STATUSES.length],
          notes: n % 7 === 0 ? "Follow up after demo" : null,
          assignedCounselorId: n % 3 === 0 ? counselor.id : admin.id,
          score: (n * 13) % 101,
          createdAt: new Date(Date.now() - n * 36 * 60 * 60 * 1000),
        };
      }),
    });
  }

  const studentCount = await prisma.student.count();
  if (studentCount < 100) {
    const remaining = 100 - studentCount;
    const convertedLeads = await prisma.lead.findMany({
      where: { status: "CONVERTED" },
      take: remaining,
      select: { id: true, name: true, phone: true, email: true },
    });
    const extra = remaining - convertedLeads.length;
    const payload: Prisma.StudentCreateManyInput[] = convertedLeads.map((lead, index) => {
      const web = index % 2 === 0;
      return {
        name: lead.name.replace("Lead", "Student"),
        phone: lead.phone,
        email: lead.email,
        courseId: web ? courseA.id : courseB.id,
        batchId: web ? batchA.id : batchB.id,
        enrollmentDate: new Date(Date.now() - index * 24 * 60 * 60 * 1000),
        status: index % 11 === 0 ? "ON_HOLD" : "ACTIVE",
        leadId: lead.id,
      };
    });
    for (let i = 0; i < extra; i += 1) {
      const n = studentCount + payload.length + 1;
      const web = n % 2 === 0;
      payload.push({
        name: `Student ${n}`,
        phone: `97${String(20000000 + n).slice(-8)}`,
        email: `student${n}@example.com`,
        courseId: web ? courseA.id : courseB.id,
        batchId: web ? batchA.id : batchB.id,
        enrollmentDate: new Date(Date.now() - n * 24 * 60 * 60 * 1000),
        status: "ACTIVE",
        leadId: null,
      });
    }
    await prisma.student.createMany({ data: payload });
  }

  const paymentCount = await prisma.payment.count();
  const students = await prisma.student.findMany({ select: { id: true }, take: 100 });
  if (students.length > 0 && paymentCount < 300) {
    const remaining = 300 - paymentCount;
    const rows = Array.from({ length: remaining }, (_, index) => {
      const student = students[index % students.length];
      return {
        studentId: student.id,
        amount: 4000 + (index % 5) * 1000,
        paymentDate: new Date(Date.now() - index * 12 * 60 * 60 * 1000),
        mode: MODES[index % MODES.length],
        installmentNumber: (index % 4) + 1,
        notes: null as string | null,
      };
    });
    await prisma.payment.createMany({ data: rows });
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
