import { getMyTasks, getStaffOptions } from "./actions";
import { TasksManager } from "@/components/Tasks/TasksManager";
import { requirePageRole } from "@/lib/session";

export default async function TasksPage() {
  const user = await requirePageRole(["ADMIN", "COUNSELOR", "ACCOUNTANT", "TEACHER"]);
  const [tasks, staff] = await Promise.all([getMyTasks(), getStaffOptions()]);
  return <TasksManager tasks={tasks} staff={staff} currentUserId={user.id} />;
}
