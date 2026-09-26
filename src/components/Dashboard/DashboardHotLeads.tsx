import type { FC } from "react";
import Link from "next/link";
import type { HotLeadItem } from "@/app/dashboard/data";
import { ScoreBadge } from "@/components/Leads/ScoreBadge";
import { StatusBadge } from "@/components/Leads/StatusBadge";

interface DashboardHotLeadsProps {
  leads: HotLeadItem[];
}

export const DashboardHotLeads: FC<DashboardHotLeadsProps> = ({ leads }) => {
  return (
    <section className="rounded-2xl border border-red-200 bg-red-50/50 p-5 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold text-slate-900">Hot leads</h2>
          <p className="mt-0.5 text-xs text-slate-500">Top scoring uncontacted or in-progress leads</p>
        </div>
        <Link href="/leads" className="text-xs font-medium text-brand-600 hover:underline">
          View leads
        </Link>
      </div>
      <ul className="mt-4 space-y-3">
        {leads.length === 0 ? (
          <li className="rounded-xl border border-dashed border-red-200 bg-white px-4 py-6 text-center text-sm text-slate-500">
            No hot pipeline leads yet. Scores rise with referrals, activity, and recent contact.
          </li>
        ) : (
          leads.map((lead) => (
            <li key={lead.id} className="flex flex-col gap-2 rounded-xl border border-red-100 bg-white p-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="font-medium text-slate-800">{lead.name}</p>
                <p className="mt-1 text-sm text-slate-500">{lead.phone}</p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <StatusBadge status={lead.status} />
                <ScoreBadge score={lead.score} />
                <Link href={`/leads/${lead.id}`} className="text-xs font-medium text-brand-600 hover:underline">
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
