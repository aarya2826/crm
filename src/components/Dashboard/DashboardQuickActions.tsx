"use client";

import type { FC } from "react";
import Link from "next/link";
import { GraduationCap, IndianRupee, Plus, UserPlus } from "lucide-react";

export const DashboardQuickActions: FC = () => {
  return (
    <div className="flex flex-wrap gap-2">
      <Link
        href="/leads?new=1"
        className="inline-flex items-center gap-2 rounded-xl bg-brand-600 px-3.5 py-2 text-sm font-semibold text-white shadow-sm hover:bg-brand-700 hover:shadow-lift"
      >
        <Plus className="h-4 w-4" />
        New Lead
      </Link>
      <Link
        href="/students?new=1"
        className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-sm font-semibold text-slate-700 hover:border-brand-200 hover:bg-brand-50 hover:text-brand-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
      >
        <UserPlus className="h-4 w-4" />
        New Student
      </Link>
      <Link
        href="/fees"
        className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-sm font-semibold text-slate-700 hover:border-teal-200 hover:bg-teal-50 hover:text-teal-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
      >
        <IndianRupee className="h-4 w-4" />
        Record Payment
      </Link>
      <Link
        href="/students"
        className="inline-flex items-center gap-2 rounded-xl px-3.5 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
      >
        <GraduationCap className="h-4 w-4" />
        Students
      </Link>
    </div>
  );
};
