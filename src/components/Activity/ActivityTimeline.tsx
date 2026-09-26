"use client";

import type { FC } from "react";
import { Mail, MessageSquare, NotebookPen, Phone, Users } from "lucide-react";
import { ACTIVITY_LABELS } from "@/constants/activity";
import { formatRelativeTime } from "@/lib/formatDate";
import type { ActivityDto } from "@/types/crm.types";
import type { ActivityTypeValue } from "@/constants/activity";

const ICONS: Record<ActivityTypeValue, typeof Phone> = {
  CALL: Phone,
  EMAIL: Mail,
  SMS: MessageSquare,
  NOTE: NotebookPen,
  MEETING: Users,
};

interface ActivityTimelineProps {
  items: ActivityDto[];
}

export const ActivityTimeline: FC<ActivityTimelineProps> = ({ items }) => {
  if (items.length === 0) {
    return <p className="text-sm text-slate-500">No interactions logged yet.</p>;
  }

  return (
    <ol className="space-y-3">
      {items.map((item) => {
        const Icon = ICONS[item.type];
        return (
          <li key={item.id} className="flex gap-3">
            <span className="mt-0.5 rounded-lg bg-brand-50 p-2 text-brand-700">
              <Icon className="h-4 w-4" />
            </span>
            <div>
              <p className="text-sm font-medium text-slate-900">{ACTIVITY_LABELS[item.type]}</p>
              <p className="text-sm text-slate-600">{item.description}</p>
              <p className="mt-1 text-xs text-slate-400">
                {item.createdByName} · {formatRelativeTime(item.createdAt)}
              </p>
            </div>
          </li>
        );
      })}
    </ol>
  );
};
