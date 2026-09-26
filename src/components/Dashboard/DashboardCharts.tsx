"use client";

import { memo, type FC } from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { ChartDatum } from "@/app/dashboard/data";
import { formatCompactCurrency, formatCurrency } from "@/lib/formatDate";

interface DashboardChartsProps {
  leadsByStatus: ChartDatum[];
  leadsBySource: ChartDatum[];
  feesByMonth: ChartDatum[];
}

const chartTooltipStyle = {
  borderRadius: 14,
  border: "1px solid #e2e8f0",
  fontSize: 12,
  boxShadow: "0 12px 30px -16px rgb(15 23 42 / 0.35)",
};

export const DashboardCharts: FC<DashboardChartsProps> = memo(function DashboardCharts({
  leadsByStatus,
  leadsBySource,
  feesByMonth,
}) {
  const sourceTotal = leadsBySource.reduce((sum, item) => sum + item.value, 0);

  return (
    <div className="space-y-6">
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="surface-card p-5">
          <h2 className="card-title">Leads by status</h2>
          <p className="caption mb-4 mt-1">Pipeline across every lead stage</p>
          <div className="h-64 min-h-[16rem]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={leadsByStatus} barSize={26}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: "#64748b" }} axisLine={false} tickLine={false} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: "#64748b" }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={chartTooltipStyle} />
                <Bar dataKey="value" radius={[8, 8, 0, 0]}>
                  {leadsByStatus.map((entry) => (
                    <Cell key={entry.name} fill={entry.fill ?? "#4f46e5"} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="surface-card p-5">
          <h2 className="card-title">Leads by source</h2>
          <p className="caption mb-4 mt-1">Where new enquiries come from</p>
          <div className="h-64 min-h-[16rem]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={leadsBySource} dataKey="value" nameKey="name" innerRadius={48} outerRadius={78} paddingAngle={2}>
                  {leadsBySource.map((entry) => (
                    <Cell key={entry.name} fill={entry.fill ?? "#4f46e5"} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={chartTooltipStyle}
                  formatter={(value) => {
                    const count = Number(value);
                    const pct = sourceTotal ? Math.round((count / sourceTotal) * 100) : 0;
                    return [`${count} (${pct}%)`, "Leads"];
                  }}
                />
                <Legend iconType="circle" wrapperStyle={{ fontSize: 12 }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
      <div className="surface-card p-5">
        <h2 className="card-title">Fees collected</h2>
        <p className="caption mb-4 mt-1">Last 6 months of recorded payments</p>
        <div className="h-64 min-h-[16rem]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={feesByMonth}>
              <defs>
                <linearGradient id="feeFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#4f46e5" stopOpacity={0.28} />
                  <stop offset="100%" stopColor="#4f46e5" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="name" tick={{ fontSize: 11, fill: "#64748b" }} axisLine={false} tickLine={false} />
              <YAxis
                tick={{ fontSize: 11, fill: "#64748b" }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(value) => formatCompactCurrency(Number(value))}
              />
              <Tooltip contentStyle={chartTooltipStyle} formatter={(value) => [formatCurrency(Number(value)), "Collected"]} />
              <Area type="monotone" dataKey="value" stroke="#4f46e5" strokeWidth={2.5} fill="url(#feeFill)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
});
