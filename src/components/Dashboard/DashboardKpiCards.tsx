"use client";

import type { FC } from "react";
import Link from "next/link";
import { GraduationCap, IndianRupee, Users, Wallet } from "lucide-react";
import { CountUp } from "@/components/common/CountUp";
import type { KpiTrend } from "@/app/dashboard/data";

interface KpiCard {
  label: string;
  value: number;
  prefix?: string;
  href: string;
  hint: string;
  iconBg: string;
  iconColor: string;
  icon: typeof Users;
  trend: KpiTrend;
  invertTrend?: boolean;
}

interface DashboardKpiCardsProps {
  cards: KpiCard[];
}

function Sparkline({ values, className }: { values: number[]; className: string }) {
  const max = Math.max(...values, 1);
  const points = values
    .map((value, index) => {
      const x = values.length === 1 ? 0 : (index / (values.length - 1)) * 100;
      const y = 100 - (value / max) * 100;
      return `${x},${y}`;
    })
    .join(" ");
  return (
    <svg className={`pointer-events-none absolute inset-x-2 top-14 h-16 w-[calc(100%-1rem)] opacity-20 ${className}`} viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden>
      <polyline fill="none" stroke="currentColor" strokeWidth="3" points={points} />
    </svg>
  );
}

export const DashboardKpiCards: FC<DashboardKpiCardsProps> = ({ cards }) => {
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {cards.map((card) => {
        const Icon = card.icon;
        const up = card.trend.percent >= 0;
        const good = card.invertTrend ? !up : up;
        return (
          <Link
            key={card.label}
            href={card.href}
            className="surface-card group relative overflow-hidden p-5 pb-8 transition hover:-translate-y-0.5 hover:shadow-lift"
          >
            <Sparkline values={card.trend.sparkline} className={card.iconColor} />
            <div className="relative flex items-start justify-between gap-3">
              <p className="caption font-medium">{card.label}</p>
              <span className={`rounded-xl p-2 ${card.iconBg}`}>
                <Icon className={`h-4 w-4 ${card.iconColor}`} />
              </span>
            </div>
            <p className="relative mt-3 text-2xl font-semibold tracking-tight text-slate-900 dark:text-slate-50">
              <CountUp value={card.value} prefix={card.prefix} />
            </p>
            <p className={`relative mt-2 text-xs font-semibold ${good ? "text-emerald-600" : "text-red-600"}`}>
              {up ? "▲" : "▼"} {Math.abs(card.trend.percent)}% vs last month
            </p>
            <p className="relative mt-1 caption group-hover:text-brand-600">{card.hint} →</p>
          </Link>
        );
      })}
    </div>
  );
};

export { GraduationCap, IndianRupee, Users, Wallet };
