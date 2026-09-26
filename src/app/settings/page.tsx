import { getBatches } from "@/app/batches/actions";
import { getCourses } from "@/app/courses/actions";
import { getInstituteSettings } from "./actions";
import { getMessageTemplates } from "@/app/templates/actions";
import { getUsers } from "@/app/users/actions";
import { SettingsWorkspace } from "@/components/Settings/SettingsWorkspace";
import { requirePageRole } from "@/lib/session";

export default async function SettingsPage() {
  await requirePageRole(["ADMIN"]);
  const [profile, courses, batches, users, templates] = await Promise.all([
    getInstituteSettings(),
    getCourses(),
    getBatches(),
    getUsers(),
    getMessageTemplates(),
  ]);

  return (
    <SettingsWorkspace profile={profile} courses={courses} batches={batches} users={users} templates={templates} />
  );
}
