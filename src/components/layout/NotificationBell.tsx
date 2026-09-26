"use client";

import { useState } from "react";
import type { FC } from "react";
import { useRouter } from "next/navigation";
import { Bell } from "lucide-react";
import { markNotificationRead } from "@/app/notifications/actions";
import type { NotificationDto } from "@/types/crm.types";

interface NotificationBellProps {
  items: NotificationDto[];
}

export const NotificationBell: FC<NotificationBellProps> = ({ items }) => {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const unread = items.filter((item) => !item.readAt).length;

  const handleClick = async (item: NotificationDto): Promise<void> => {
    try {
      await markNotificationRead(item.id);
    } catch (error) {
      console.error(error);
    }
    setOpen(false);
    router.push(item.href);
    router.refresh();
  };

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="relative rounded-lg p-2 text-slate-600 hover:bg-slate-100"
        aria-label="Notifications"
      >
        <Bell className="h-5 w-5" />
        {unread > 0 ? (
          <span className="absolute right-1 top-1 rounded-full bg-red-600 px-1.5 text-[10px] font-semibold text-white">
            {unread}
          </span>
        ) : null}
      </button>
      {open ? (
        <div className="absolute right-0 z-50 mt-2 w-80 rounded-xl border border-slate-200 bg-white p-2 shadow-lg">
          {items.length === 0 ? (
            <p className="px-3 py-6 text-center text-sm text-slate-500">No notifications</p>
          ) : (
            items.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => handleClick(item)}
                className={`block w-full rounded-lg px-3 py-2 text-left hover:bg-slate-50 ${item.readAt ? "opacity-70" : ""}`}
              >
                <p className="text-sm font-medium text-slate-900">{item.title}</p>
                <p className="text-xs text-slate-500">{item.message}</p>
              </button>
            ))
          )}
        </div>
      ) : null}
    </div>
  );
};
