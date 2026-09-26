import type { FC } from "react";
import type { StudentAttendanceView } from "@/app/attendance/actions";

interface AttendanceCalendarProps {
  view: StudentAttendanceView;
}

function tone(status: string | null): string {
  if (status === "PRESENT") {
    return "bg-emerald-500";
  }
  if (status === "LATE") {
    return "bg-amber-400";
  }
  if (status === "ABSENT") {
    return "bg-red-400";
  }
  return "bg-slate-200 dark:bg-slate-700";
}

export const AttendanceCalendar: FC<AttendanceCalendarProps> = ({ view }) => {
  return (
    <section className="surface-card p-5">
      <h2 className="text-sm font-semibold text-slate-900">Attendance</h2>
      <p className="mt-3 text-sm">
        This month: {view.monthPercent === null ? "No records yet" : `${view.monthPercent}% present`}
      </p>
      <p className="text-xs text-slate-500">Present {view.present} · Late {view.late} · Absent {view.absent}</p>
      <div className="mt-4 grid grid-cols-7 gap-1">
        {view.days.map((day) => (
          <div
            key={day.date}
            title={`${new Date(day.date).toLocaleDateString("en-IN")} ${day.status ?? "unmarked"}`}
            className={`h-6 rounded ${tone(day.status)}`}
          />
        ))}
      </div>
      <p className="mt-2 text-[11px] text-slate-400">Last 30 days · green present, amber late, red absent</p>
    </section>
  );
};
