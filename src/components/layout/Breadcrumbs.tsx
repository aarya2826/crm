"use client";

import type { FC } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const LABELS: Record<string, string> = {
  "": "Dashboard",
  leads: "Leads",
  students: "Students",
  tasks: "Tasks",
  attendance: "Attendance",
  courses: "Courses",
  batches: "Batches",
  fees: "Fees",
  reports: "Reports",
  settings: "Settings",
};

export const Breadcrumbs: FC<{ currentName?: string }> = ({ currentName }) => {
  const pathname = usePathname();
  const parts = pathname.split("/").filter(Boolean);
  if (parts.length === 0) {
    return <p className="text-xs text-slate-500">Dashboard</p>;
  }

  return (
    <nav className="flex flex-wrap items-center gap-1 text-xs text-slate-500">
      <Link href="/" className="hover:text-brand-600">
        Home
      </Link>
      {parts.map((part, index) => {
        const href = `/${parts.slice(0, index + 1).join("/")}`;
        const isLast = index === parts.length - 1;
        const label = isLast && currentName ? currentName : LABELS[part] ?? "Details";
        return (
          <span key={href} className="flex items-center gap-1">
            <span>/</span>
            {isLast ? (
              <span className="font-medium text-slate-700 dark:text-slate-200">{label}</span>
            ) : (
              <Link href={href} className="hover:text-brand-600">
                {label}
              </Link>
            )}
          </span>
        );
      })}
    </nav>
  );
};
