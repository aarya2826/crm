import { notFound } from "next/navigation";
import { getActivities } from "@/app/activities/actions";
import { getStudentAttendanceView } from "@/app/attendance/actions";
import { getStudentDocuments } from "@/app/documents/actions";
import { getStudentFeeRow } from "@/app/fees/actions";
import { getStudentById } from "@/app/students/actions";
import { getStaffOptions, getTasksForRecord } from "@/app/tasks/actions";
import { getMessageTemplates } from "@/app/templates/actions";
import { StudentDetail } from "@/components/Students/StudentDetail";
import { requirePageRole } from "@/lib/session";

export default async function StudentDetailPage({ params }: { params: { id: string } }) {
  const user = await requirePageRole(["ADMIN", "COUNSELOR", "ACCOUNTANT", "TEACHER"]);
  const [student, activities, tasks, staff, fee, attendance, documents, templates] = await Promise.all([
    getStudentById(params.id),
    getActivities({ studentId: params.id }),
    getTasksForRecord({ studentId: params.id }),
    getStaffOptions(),
    getStudentFeeRow(params.id),
    getStudentAttendanceView(params.id),
    getStudentDocuments(params.id),
    getMessageTemplates(),
  ]);

  if (!student) {
    notFound();
  }

  const canViewFees = user.role === "ADMIN" || user.role === "ACCOUNTANT";

  return (
    <StudentDetail
      student={student}
      fee={canViewFees ? fee : null}
      attendance={attendance}
      activities={activities}
      tasks={tasks}
      staff={staff}
      currentUserId={user.id}
      canViewFees={canViewFees}
      documents={documents}
      templates={templates}
      canEditDocuments={user.role === "ADMIN" || user.role === "COUNSELOR"}
    />
  );
}
