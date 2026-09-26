import { getStudentsPage } from "./actions";
import { getBatches } from "@/app/batches/actions";
import { getCourses } from "@/app/courses/actions";
import { StudentsManager } from "@/components/Students/StudentsManager";
import { permissionsFor } from "@/constants/roles";
import type { StudentStatusValue } from "@/constants/students";
import { requirePageRole } from "@/lib/session";

export default async function StudentsPage({
  searchParams,
}: {
  searchParams: Record<string, string | undefined>;
}) {
  const user = await requirePageRole(["ADMIN", "COUNSELOR", "ACCOUNTANT", "TEACHER"]);
  const [list, courses, batches] = await Promise.all([
    getStudentsPage(searchParams),
    getCourses(),
    getBatches(),
  ]);

  return (
    <StudentsManager
      list={list}
      search={searchParams.q ?? ""}
      courseId={searchParams.courseId ?? ""}
      batchId={searchParams.batchId ?? ""}
      status={(searchParams.status as StudentStatusValue) ?? "ALL"}
      courses={courses}
      batches={batches}
      permissions={permissionsFor(user.role)}
      openCreate={searchParams.new === "1"}
    />
  );
}
