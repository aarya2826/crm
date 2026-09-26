import type { FC } from "react";
import Link from "next/link";
import { GraduationCap, IndianRupee, UserPlus } from "lucide-react";
import type { ActivityItem, ActivityType } from "@/app/dashboard/data";
import { formatRelativeTime } from "@/lib/formatDate";

const ACTIVITY_META: Record<
  ActivityType,
  { icon: typeof UserPlus; iconBg: string; iconColor: string }
> = {
  lead: { icon: UserPlus, iconBg: "bg-brand-50", iconColor: "text-brand-600" },
  student: { icon: GraduationCap, iconBg: "bg-emerald-50", iconColor: "text-emerald-600" },
  payment: { icon: IndianRupee, iconBg: "bg-amber-50", iconColor: "text-amber-600" },
};

interface DashboardActivityProps {
  items: ActivityItem[];
}

export const DashboardActivity: FC<DashboardActivityProps> = ({ items }) => {
  return (
    <section className="surface-card p-5">
      <h2 className="text-sm font-semibold text-slate-900">Recent activity</h2>
      <ul className="mt-4 space-y-2">
        {items.length === 0 ? (
          <li className="rounded-xl border border-dashed border-slate-200 px-4 py-6 text-center text-sm text-slate-500">
            No recent activity yet.
          </li>
        ) : (
          items.map((item) => {
            const meta = ACTIVITY_META[item.type];
            const Icon = meta.icon;
            return (
              <li key={item.id}>
                <Link
                  href={item.href}
                  className="flex items-start gap-3 rounded-xl px-2 py-2 transition hover:bg-slate-50"
                >
                  <span className={`mt-0.5 rounded-lg p-2 ${meta.iconBg}`}>
                    <Icon className={`h-4 w-4 ${meta.iconColor}`} />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm text-slate-800">{item.title}</span>
                    <span className="mt-0.5 block text-xs text-slate-400">
                      {formatRelativeTime(item.at)}
                    </span>
                  </span>
                </Link>
              </li>
            );
          })
        )}
      </ul>
    </section>
  );
};
