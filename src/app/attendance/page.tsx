import { getAttendanceSheet } from "./actions";
import { getBatches } from "@/app/batches/actions";
import { AttendanceManager } from "@/components/Attendance/AttendanceManager";
import { requirePageRole } from "@/lib/session";
import { toDateInputValue } from "@/lib/formatDate";

export default async function AttendancePage() {
  await requirePageRole(["ADMIN", "TEACHER"]);
  const batches = await getBatches();
  if (batches[0]) {
    await getAttendanceSheet(batches[0].id, toDateInputValue());
  }
  return <AttendanceManager batches={batches} />;
}
