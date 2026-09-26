"use client";

import { useState } from "react";
import type { FC } from "react";
import { signOut } from "next-auth/react";
import { LogOut, UserRound } from "lucide-react";
import { ROLE_LABELS } from "@/constants/roles";
import type { AppRole } from "@/constants/roles";

interface UserMenuProps {
  name: string;
  email: string;
  role: AppRole;
}

export const UserMenu: FC<UserMenuProps> = ({ name, email, role }) => {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="flex items-center gap-2 rounded-lg border border-slate-200 px-2.5 py-1.5 text-left hover:bg-slate-50"
        aria-haspopup="menu"
        aria-expanded={open}
      >
        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-50 text-brand-700">
          <UserRound className="h-4 w-4" />
        </span>
        <span className="hidden sm:block">
          <span className="block text-sm font-medium text-slate-900">{name}</span>
          <span className="block text-xs text-slate-500">{ROLE_LABELS[role]}</span>
        </span>
      </button>
      {open ? (
        <div
          className="absolute right-0 z-50 mt-2 w-56 rounded-xl border border-slate-200 bg-white p-3 shadow-lg"
          role="menu"
        >
          <p className="text-sm font-medium text-slate-900">{name}</p>
          <p className="truncate text-xs text-slate-500">{email}</p>
          <p className="mt-1 text-xs font-medium text-brand-700">{ROLE_LABELS[role]}</p>
          <button
            type="button"
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="mt-3 flex w-full items-center gap-2 rounded-lg px-2 py-2 text-sm text-slate-700 hover:bg-slate-50"
          >
            <LogOut className="h-4 w-4" />
            Logout
          </button>
        </div>
      ) : null}
    </div>
  );
};
