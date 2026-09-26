import { getLeadsPage } from "./actions";
import { getBatches } from "@/app/batches/actions";
import { getCourses } from "@/app/courses/actions";
import { getStaffOptions } from "@/app/tasks/actions";
import { LeadsManager } from "@/components/Leads/LeadsManager";
import { permissionsFor } from "@/constants/roles";
import type { LeadStatusValue } from "@/constants/leads";
import type { ScoreBand } from "@/lib/leadScore";
import { requirePageRole } from "@/lib/session";

export default async function LeadsPage({
  searchParams,
}: {
  searchParams: Record<string, string | undefined>;
}) {
  const user = await requirePageRole(["ADMIN", "COUNSELOR"]);
  const [list, courses, batches, staff] = await Promise.all([
    getLeadsPage(searchParams),
    getCourses(),
    getBatches(),
    getStaffOptions(),
  ]);

  return (
    <LeadsManager
      list={list}
      search={searchParams.q ?? ""}
      status={(searchParams.status as LeadStatusValue) ?? "ALL"}
      score={(searchParams.score as ScoreBand) ?? "ALL"}
      courses={courses}
      batches={batches}
      permissions={permissionsFor(user.role)}
      staff={staff}
      openCreate={searchParams.new === "1"}
    />
  );
}
