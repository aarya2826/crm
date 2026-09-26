import type { FC } from "react";
import Link from "next/link";
import { Phone, UserRound } from "lucide-react";
import type { FollowUpItem } from "@/app/dashboard/data";
import { StatusBadge } from "@/components/Leads/StatusBadge";

interface DashboardFollowUpsProps {
  followUps: FollowUpItem[];
}

export const DashboardFollowUps: FC<DashboardFollowUpsProps> = ({ followUps }) => {
  return (
    <section className="rounded-2xl border border-amber-200 bg-amber-50/60 p-5 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold text-slate-900">Today&apos;s follow-ups</h2>
          <p className="mt-0.5 text-xs text-slate-500">
            {followUps.length === 0
              ? "Nothing scheduled for today"
              : `${followUps.length} lead${followUps.length === 1 ? "" : "s"} to contact`}
          </p>
        </div>
        <Link href="/leads" className="text-xs font-medium text-brand-600 hover:underline">
          View leads
        </Link>
      </div>
      <ul className="mt-4 space-y-3">
        {followUps.length === 0 ? (
          <li className="rounded-xl border border-dashed border-amber-200 bg-white px-4 py-6 text-center text-sm text-slate-500">
            No follow-ups today. Set a next follow-up date on a lead to see it here.
          </li>
        ) : (
          followUps.map((lead) => (
            <li
              key={lead.id}
              className="flex flex-col gap-3 rounded-xl border border-amber-100 bg-white p-3 sm:flex-row sm:items-center sm:justify-between"
            >
              <div>
                <p className="font-medium text-slate-800">{lead.name}</p>
                <p className="mt-1 text-sm text-slate-500">{lead.phone}</p>
                <div className="mt-2">
                  <StatusBadge status={lead.status} />
                </div>
              </div>
              <div className="flex items-center gap-2">
                <a
                  href={`tel:${lead.phone}`}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-brand-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-brand-700"
                >
                  <Phone className="h-3.5 w-3.5" />
                  Call
                </a>
                <Link
                  href="/leads"
                  className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
                >
                  <UserRound className="h-3.5 w-3.5" />
                  Open
                </Link>
              </div>
            </li>
          ))
        )}
      </ul>
    </section>
  );
};
