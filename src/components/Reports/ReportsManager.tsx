"use client";

/** Reports tabs, date range, charts, Excel export, and PNG download. */

import { useMemo, useState } from "react";
import type { FC } from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { getAnalyticsData, type AnalyticsData } from "@/app/reports/analytics";
import { Button } from "@/components/common/Button";
import { ChartCard } from "./ChartCard";
import { exportRowsToExcel } from "@/lib/exportExcel";
import { formatCurrency } from "@/lib/formatDate";
import { notify } from "@/lib/toast";
import { withTimeout } from "@/lib/withTimeout";
import type { LeadDto } from "@/types/lead.types";
import type { StudentDto } from "@/types/academic.types";

const TABS = ["Overview", "Leads", "Students", "Revenue", "Staff"] as const;
type Tab = (typeof TABS)[number];

const tooltipStyle = {
  borderRadius: 14,
  border: "1px solid #e2e8f0",
  fontSize: 12,
  boxShadow: "0 12px 30px -16px rgb(15 23 42 / 0.35)",
};

interface ReportsManagerProps {
  initial: AnalyticsData;
  leads: LeadDto[];
  students: StudentDto[];
  paymentRows: Array<[string, string, number, string, string]>;
}

function localIso(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function monthRange(): { from: string; to: string } {
  const now = new Date();
  const from = new Date(now.getFullYear(), now.getMonth(), 1);
  return { from: localIso(from), to: localIso(now) };
}

export const ReportsManager: FC<ReportsManagerProps> = ({ initial, leads, students, paymentRows }) => {
  const defaults = monthRange();
  const [from, setFrom] = useState(defaults.from);
  const [to, setTo] = useState(defaults.to);
  const [data, setData] = useState(initial);
  const [tab, setTab] = useState<Tab>("Overview");
  const [loading, setLoading] = useState(false);

  const maxFunnel = Math.max(1, ...data.funnel.map((row) => row.value));

  const refresh = async (): Promise<void> => {
    setLoading(true);
    try {
      setData(await withTimeout(getAnalyticsData({ from, to })));
    } catch (error) {
      notify.error(error instanceof Error ? error.message : "Could not load reports.");
    } finally {
      setLoading(false);
    }
  };

  const exportTab = async (): Promise<void> => {
    if (tab === "Leads") {
      await exportRowsToExcel("leads", "Leads", ["Name", "Phone", "Status", "Source"], leads.map((lead) => [lead.name, lead.phone, lead.status, lead.source]));
    } else if (tab === "Students") {
      await exportRowsToExcel("students", "Students", ["Name", "Course", "Status"], students.map((student) => [student.name, student.courseName, student.status]));
    } else if (tab === "Revenue") {
      await exportRowsToExcel("payments", "Payments", ["Student", "Course", "Amount", "Date", "Mode"], paymentRows);
    } else if (tab === "Staff") {
      await exportRowsToExcel("staff", "Staff", ["Name", "Assigned", "Converted"], data.staffPerformance.map((row) => [row.name, row.assigned, row.converted]));
    } else {
      await exportRowsToExcel("overview", "Overview", ["Metric", "Value"], [
        ["Leads", data.comparison.leads],
        ["Students", data.comparison.students],
        ["Revenue", data.comparison.revenue],
      ]);
    }
    notify.success("Export ready");
  };

  const pieColors = useMemo(() => ["#4f46e5", "#0d9488", "#f59e0b", "#7c3aed", "#64748b"], []);

  return (
    <section className="space-y-6">
      <div>
        <h1 className="page-title">Reports</h1>
        <p className="body-text mt-1">Conversion, collections, and counselor performance.</p>
      </div>
      <div className="surface-card flex flex-wrap items-end gap-3 p-4">
        <label className="caption">
          From
          <input type="date" value={from} onChange={(event) => setFrom(event.target.value)} className="input-field mt-1" />
        </label>
        <label className="caption">
          To
          <input type="date" value={to} onChange={(event) => setTo(event.target.value)} className="input-field mt-1" />
        </label>
        <Button type="button" loading={loading} onClick={() => void refresh()}>
          Apply range
        </Button>
        <Button type="button" variant="secondary" onClick={() => void exportTab()}>
          Export Excel
        </Button>
      </div>
      <div className="flex flex-wrap gap-2">
        {TABS.map((item) => (
          <button
            key={item}
            type="button"
            onClick={() => setTab(item)}
            className={`rounded-xl px-3 py-2 text-sm font-semibold ${tab === item ? "bg-brand-600 text-white" : "bg-white text-slate-600 ring-1 ring-slate-200 hover:bg-brand-50 dark:bg-slate-900 dark:ring-slate-700"}`}
          >
            {item === "Staff" ? "Staff Performance" : item}
          </button>
        ))}
      </div>

      {tab === "Overview" ? (
        <div className="space-y-4">
          <div>
            <p className="caption mb-2">Selected range vs previous equal span</p>
            <div className="grid gap-4 sm:grid-cols-3">
              {[
                ["Leads", data.comparison.leads, data.comparison.leadsPrev, false],
                ["Students", data.comparison.students, data.comparison.studentsPrev, false],
                ["Revenue", data.comparison.revenue, data.comparison.revenuePrev, true],
              ].map(([label, current, previous, money]) => (
                <div key={String(label)} className="surface-card p-4">
                  <p className="caption">{label}</p>
                  <p className="mt-2 text-2xl font-semibold">{money ? formatCurrency(Number(current)) : current}</p>
                  <p className="caption mt-1">Prev {money ? formatCurrency(Number(previous)) : previous}</p>
                </div>
              ))}
            </div>
          </div>
          <div>
            <p className="caption mb-2">This week vs last week</p>
            <div className="grid gap-4 sm:grid-cols-3">
              {[
                ["Leads", data.comparison.weekLeads, data.comparison.weekLeadsPrev, false],
                ["Students", data.comparison.weekStudents, data.comparison.weekStudentsPrev, false],
                ["Revenue", data.comparison.weekRevenue, data.comparison.weekRevenuePrev, true],
              ].map(([label, current, previous, money]) => (
                <div key={`week-${String(label)}`} className="surface-card p-4">
                  <p className="caption">{label}</p>
                  <p className="mt-2 text-2xl font-semibold">{money ? formatCurrency(Number(current)) : current}</p>
                  <p className="caption mt-1">Prev week {money ? formatCurrency(Number(previous)) : previous}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : null}

      {tab === "Leads" || tab === "Overview" ? (
        <div className="grid gap-6 lg:grid-cols-2">
          <ChartCard title="Conversion funnel" caption="Relative width by stage" fileName="funnel">
            <div className="flex flex-col items-center gap-1 py-2">
              {data.funnel.map((row) => {
                const width = Math.max(32, (row.value / maxFunnel) * 100);
                return (
                  <div key={row.name} className="w-full" style={{ maxWidth: `${width}%` }}>
                    <div
                      className="flex h-10 items-center justify-between bg-brand-600 px-4 text-xs font-semibold text-white"
                      style={{ clipPath: "polygon(7% 0, 93% 0, 100% 100%, 0 100%)" }}
                    >
                      <span>{row.name}</span>
                      <span>{row.value}</span>
                    </div>
                  </div>
                );
              })}
            </div>
            {data.avgDaysToConvert != null ? <p className="caption mt-3">Avg time to conversion: {data.avgDaysToConvert} days</p> : null}
          </ChartCard>
          <ChartCard title="Source conversion" fileName="sources">
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.sourceConversion}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="source" tick={{ fontSize: 11 }} />
                  <YAxis allowDecimals={false} />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Bar dataKey="converted" fill="#0d9488" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </ChartCard>
        </div>
      ) : null}

      {tab === "Leads" ? (
        <div className="surface-card overflow-x-auto p-5">
          <h2 className="card-title">Counselor performance</h2>
          <table className="mt-3 min-w-full text-sm">
            <thead className="caption text-left">
              <tr>
                <th className="py-2">Counselor</th>
                <th className="text-right">Leads</th>
                <th className="text-right">Converted</th>
                <th className="text-right">Rate</th>
                <th className="text-right">Avg response</th>
              </tr>
            </thead>
            <tbody>
              {data.counselorBoard.map((row) => (
                <tr key={row.name} className="border-t border-slate-100 dark:border-slate-800">
                  <td className="py-2">{row.name}</td>
                  <td className="text-right">{row.assigned}</td>
                  <td className="text-right">{row.converted}</td>
                  <td className="text-right">{row.rate}%</td>
                  <td className="text-right">{row.avgHours == null ? "n/a" : `${row.avgHours}h`}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}

      {tab === "Revenue" || tab === "Overview" ? (
        <div className="grid gap-6 lg:grid-cols-2">
          <ChartCard title="Monthly revenue" fileName="revenue-trend">
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data.monthlyRevenue}>
                  <defs>
                    <linearGradient id="revFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#4f46e5" stopOpacity={0.3} />
                      <stop offset="100%" stopColor="#4f46e5" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                  <YAxis tickFormatter={(value) => formatCurrency(Number(value))} width={72} />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Area type="monotone" dataKey="collected" stroke="#4f46e5" fill="url(#revFill)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </ChartCard>
          <ChartCard title="Revenue by course" fileName="revenue-course">
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={data.revenueByCourse} dataKey="collected" nameKey="course" innerRadius={48} outerRadius={78}>
                    {data.revenueByCourse.map((row, index) => (
                      <Cell key={row.course} fill={pieColors[index % pieColors.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={tooltipStyle} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </ChartCard>
          <ChartCard title="Collected vs pending" fileName="pending-collected">
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.revenueByCourse}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="course" tick={{ fontSize: 10 }} />
                  <YAxis tickFormatter={(value) => formatCurrency(Number(value))} width={72} />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Bar dataKey="collected" stackId="rev" fill="#4f46e5" radius={[0, 0, 0, 0]} />
                  <Bar dataKey="pending" stackId="rev" fill="#f59e0b" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </ChartCard>
        </div>
      ) : null}

      {tab === "Students" ? (
        <div className="grid gap-6 lg:grid-cols-2">
          <ChartCard title="Enrollment trend" fileName="enrollments">
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.enrollments}>
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                  <YAxis allowDecimals={false} />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Bar dataKey="value" fill="#4f46e5" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </ChartCard>
          <div className="surface-card p-5">
            <h2 className="card-title">Batch fill (relative)</h2>
            <p className="caption mt-1">No seat capacity is stored — fill is relative to the largest batch.</p>
            <p className="mt-3 text-sm font-semibold">Dropout rate {data.dropoutRate}%</p>
            <ul className="mt-3 space-y-2">
              {data.batchFill.map((row) => (
                <li key={row.batch}>
                  <div className="flex justify-between caption">
                    <span>{row.batch}</span>
                    <span>{row.enrolled}</span>
                  </div>
                  <div className="mt-1 h-2 rounded-full bg-slate-100 dark:bg-slate-800">
                    <div className="h-2 rounded-full bg-teal-600" style={{ width: `${row.fill}%` }} />
                  </div>
                </li>
              ))}
            </ul>
          </div>
          <ChartCard title="Attendance trend" fileName="attendance">
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data.attendanceTrend}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                  <YAxis allowDecimals={false} />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Area type="monotone" dataKey="present" stroke="#0d9488" fill="#0d948833" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </ChartCard>
        </div>
      ) : null}

      {tab === "Staff" ? (
        <div className="grid gap-4 md:grid-cols-2">
          {data.counselorBoard.map((row) => (
            <article key={row.name} className="surface-card p-5">
              <h3 className="card-title">{row.name}</h3>
              <p className="mt-2 text-sm text-slate-600">
                {row.assigned} leads · {row.converted} converted · {row.rate}%
              </p>
              <p className="caption mt-1">
                Avg first response {row.avgHours == null ? "n/a" : `${row.avgHours}h`}
              </p>
            </article>
          ))}
          {data.accountantBoard.map((row) => (
            <article key={row.name} className="surface-card p-5">
              <h3 className="card-title">Accounts</h3>
              <p className="mt-2 text-sm">{formatCurrency(row.collections)} collected · {row.payments} payments</p>
            </article>
          ))}
        </div>
      ) : null}

      {tab === "Revenue" ? (
        <div className="surface-card overflow-x-auto p-5">
          <h2 className="card-title">Collected vs pending by course</h2>
          <table className="mt-3 min-w-full text-sm">
            <thead className="caption text-left">
              <tr>
                <th className="py-2">Course</th>
                <th className="text-right">Collected</th>
                <th className="text-right">Pending</th>
              </tr>
            </thead>
            <tbody>
              {data.revenueByCourse.map((row) => (
                <tr key={row.course} className="border-t border-slate-100">
                  <td className="py-2">{row.course}</td>
                  <td className="text-right">{formatCurrency(row.collected)}</td>
                  <td className="text-right">{formatCurrency(row.pending)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {data.forecast.length > 0 ? (
            <p className="caption mt-4">
              Forecast remaining from next due dates: {formatCurrency(data.forecast.reduce((sum, row) => sum + row.amount, 0))}
            </p>
          ) : (
            <p className="caption mt-4">No upcoming installment due dates recorded.</p>
          )}
        </div>
      ) : null}
    </section>
  );
};
