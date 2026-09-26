import { getDashboardData } from "@/app/dashboard/data";
import { getInstituteName } from "@/app/settings/actions";
import { DashboardActivity } from "@/components/Dashboard/DashboardActivity";
import { DashboardCharts } from "@/components/Dashboard/DashboardCharts";
import {
  DashboardKpiCards,
  GraduationCap,
  IndianRupee,
  Users,
  Wallet,
} from "@/components/Dashboard/DashboardKpiCards";
import { DashboardFollowUps } from "@/components/Dashboard/DashboardFollowUps";
import { DashboardHotLeads } from "@/components/Dashboard/DashboardHotLeads";
import { DashboardQuickActions } from "@/components/Dashboard/DashboardQuickActions";
import { greetingForNow } from "@/lib/formatDate";

export default async function DashboardPage() {
  let data;
  try {
    data = await getDashboardData();
  } catch (error) {
    console.error("Failed to load dashboard:", error);
    return <p className="text-sm text-red-600">Could not load dashboard.</p>;
  }

  const instituteName = await getInstituteName();
  const cards = [
    {
      label: "Total leads",
      value: data.totalLeads,
      href: "/leads",
      hint: "Open leads",
      iconBg: "bg-brand-50",
      iconColor: "text-brand-600",
      icon: Users,
      trend: data.leadTrend,
    },
    {
      label: "Active students",
      value: data.activeStudents,
      href: "/students",
      hint: "Open students",
      iconBg: "bg-teal-50",
      iconColor: "text-teal-600",
      icon: GraduationCap,
      trend: data.studentTrend,
    },
    {
      label: "Fees this month",
      value: data.feesThisMonth,
      prefix: "₹",
      href: "/fees",
      hint: "Open fees",
      iconBg: "bg-indigo-50",
      iconColor: "text-indigo-600",
      icon: IndianRupee,
      trend: data.feeTrend,
    },
    {
      label: "Pending dues",
      value: data.pendingDues,
      prefix: "₹",
      href: "/fees",
      hint: "Review dues",
      iconBg: "bg-amber-50",
      iconColor: "text-amber-600",
      icon: Wallet,
      trend: data.duesTrend,
      invertTrend: true,
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="caption font-medium text-brand-600">{greetingForNow()}</p>
          <h1 className="page-title mt-1">{instituteName}</h1>
          <p className="body-text mt-1">Today&apos;s snapshot of leads, students, and collections.</p>
        </div>
        <DashboardQuickActions />
      </div>
      <DashboardKpiCards cards={cards} />
      <div className="grid gap-6 xl:grid-cols-3">
        <div className="space-y-6 xl:col-span-2">
          <DashboardCharts
            leadsByStatus={data.leadsByStatus}
            leadsBySource={data.leadsBySource}
            feesByMonth={data.feesByMonth}
          />
        </div>
        <div className="space-y-6">
          <DashboardFollowUps followUps={data.todaysFollowUps} />
          <DashboardHotLeads leads={data.hotLeads} />
          <DashboardActivity items={data.recentActivity} />
        </div>
      </div>
    </div>
  );
}
