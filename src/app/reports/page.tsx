import { getPaymentsForExport } from "@/app/fees/actions";
import { getLeads } from "@/app/leads/actions";
import { getAnalyticsData } from "./analytics";
import { getStudents } from "@/app/students/actions";
import { ReportsManager } from "@/components/Reports/ReportsManager";
import { requirePageRole } from "@/lib/session";

export default async function ReportsPage() {
  await requirePageRole(["ADMIN", "COUNSELOR", "ACCOUNTANT"]);
  const now = new Date();
  const pad = (value: number) => String(value).padStart(2, "0");
  const localIso = (date: Date) =>
    `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
  const from = localIso(new Date(now.getFullYear(), now.getMonth(), 1));
  const to = localIso(now);
  const [initial, leads, students, paymentRows] = await Promise.all([
    getAnalyticsData({ from, to }),
    getLeads(),
    getStudents(),
    getPaymentsForExport(),
  ]);

  return <ReportsManager initial={initial} leads={leads} students={students} paymentRows={paymentRows} />;
}
