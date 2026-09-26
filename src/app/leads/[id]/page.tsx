import { notFound } from "next/navigation";
import { getActivities } from "@/app/activities/actions";
import { getBatches } from "@/app/batches/actions";
import { getCourses } from "@/app/courses/actions";
import { getLeadById } from "@/app/leads/actions";
import { getStaffOptions, getTasksForRecord } from "@/app/tasks/actions";
import { getMessageTemplates } from "@/app/templates/actions";
import { LeadDetail } from "@/components/Leads/LeadDetail";
import { permissionsFor } from "@/constants/roles";
import { requirePageRole } from "@/lib/session";

export default async function LeadDetailPage({ params }: { params: { id: string } }) {
  const user = await requirePageRole(["ADMIN", "COUNSELOR"]);
  const [lead, activities, tasks, staff, courses, batches, templates] = await Promise.all([
    getLeadById(params.id),
    getActivities({ leadId: params.id }),
    getTasksForRecord({ leadId: params.id }),
    getStaffOptions(),
    getCourses(),
    getBatches(),
    getMessageTemplates(),
  ]);

  if (!lead) {
    notFound();
  }

  return (
    <LeadDetail
      lead={lead}
      activities={activities}
      tasks={tasks}
      staff={staff}
      currentUserId={user.id}
      courses={courses}
      batches={batches}
      permissions={permissionsFor(user.role)}
      templates={templates}
    />
  );
}
