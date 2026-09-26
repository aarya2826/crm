import { getBatches } from "./actions";
import { getCourses } from "@/app/courses/actions";
import { BatchesManager } from "@/components/Batches/BatchesManager";
import { requirePageRole } from "@/lib/session";

export default async function BatchesPage() {
  await requirePageRole(["ADMIN"]);
  const [batches, courses] = await Promise.all([getBatches(), getCourses()]);
  return <BatchesManager initialBatches={batches} courses={courses} />;
}
