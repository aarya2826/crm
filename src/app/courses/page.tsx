import { getCourses } from "./actions";
import { CoursesManager } from "@/components/Courses/CoursesManager";
import { requirePageRole } from "@/lib/session";

export default async function CoursesPage() {
  await requirePageRole(["ADMIN"]);
  const courses = await getCourses();
  return <CoursesManager initialCourses={courses} />;
}
