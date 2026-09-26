import { getStudentFeePage } from "./actions";
import { getCourses } from "@/app/courses/actions";
import { getInstituteSettings } from "@/app/settings/actions";
import { FeesManager } from "@/components/Fees/FeesManager";
import { permissionsFor } from "@/constants/roles";
import type { FeePaymentStatus } from "@/constants/fees";
import { requirePageRole } from "@/lib/session";

export default async function FeesPage({
  searchParams,
}: {
  searchParams: Record<string, string | undefined>;
}) {
  const user = await requirePageRole(["ADMIN", "ACCOUNTANT"]);
  const [list, courses, institute] = await Promise.all([
    getStudentFeePage({
      search: searchParams.q,
      courseId: searchParams.courseId,
      status: searchParams.status,
      page: searchParams.page,
      sort: searchParams.sort,
      dir: searchParams.dir,
    }),
    getCourses(),
    getInstituteSettings(),
  ]);

  return (
    <FeesManager
      list={list}
      search={searchParams.q ?? ""}
      courseId={searchParams.courseId ?? ""}
      status={(searchParams.status as "ALL" | FeePaymentStatus | undefined) ?? "ALL"}
      courses={courses}
      institute={institute}
      canRecordPayments={permissionsFor(user.role).canRecordPayments}
    />
  );
}
