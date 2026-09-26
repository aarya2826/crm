"use client";

/** Authenticated chrome: sidebar, header, command palette, page canvas. */

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { FC, ReactNode } from "react";
import {
  BarChart3,
  BookOpen,
  CalendarDays,
  CheckSquare,
  ClipboardCheck,
  GraduationCap,
  IndianRupee,
  LayoutDashboard,
  Menu,
  PanelLeftClose,
  PanelLeftOpen,
  Settings,
  Users,
  X,
} from "lucide-react";
import { NAV_ACCESS } from "@/constants/roles";
import type { AppRole } from "@/constants/roles";
import type { SessionUser } from "@/lib/session";
import type { NotificationDto } from "@/types/crm.types";
import { usePresence } from "@/hooks/usePresence";
import { Breadcrumbs } from "./Breadcrumbs";
import { NotificationBell } from "./NotificationBell";
import { ThemeToggle } from "./ThemeToggle";
import { CommandPalette } from "./CommandPalette";
import { UserMenu } from "./UserMenu";

const NAV_ICONS: Record<string, typeof LayoutDashboard> = {
  "/": LayoutDashboard,
  "/leads": Users,
  "/students": GraduationCap,
  "/tasks": CheckSquare,
  "/attendance": ClipboardCheck,
  "/courses": BookOpen,
  "/batches": CalendarDays,
  "/fees": IndianRupee,
  "/reports": BarChart3,
  "/settings": Settings,
};

interface AppShellProps {
  children: ReactNode;
  instituteName: string;
  user: SessionUser;
  taskDueCount: number;
  notifications: NotificationDto[];
  logoDataUrl?: string;
}

export const AppShell: FC<AppShellProps> = ({
  children,
  instituteName,
  user,
  taskDueCount,
  notifications,
  logoDataUrl,
}) => {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const drawer = usePresence(open);
  const role = user.role as AppRole;

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  const items = NAV_ACCESS.filter((item) => item.roles.includes(role));
  const isActive = (href: string): boolean =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  const nav = (
    <nav className="space-y-1">
      {items.map((item) => {
        const Icon = NAV_ICONS[item.href] ?? LayoutDashboard;
        const active = isActive(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={() => setOpen(false)}
            title={item.label}
            className={`relative flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition-colors ${
              active
                ? "bg-brand-50 text-brand-700 dark:bg-slate-800 dark:text-brand-300"
                : "text-slate-600 hover:bg-slate-50 hover:text-brand-600 dark:text-slate-300 dark:hover:bg-slate-800"
            }`}
          >
            {active ? <span className="absolute inset-y-1 left-0 w-1 rounded-r bg-brand-600" /> : null}
            <Icon className="h-4 w-4 shrink-0" />
            {collapsed ? null : <span className="flex-1">{item.label}</span>}
            {!collapsed && item.href === "/tasks" && taskDueCount > 0 ? (
              <span className="rounded-full bg-red-600 px-1.5 text-[10px] font-semibold text-white">
                {taskDueCount}
              </span>
            ) : null}
          </Link>
        );
      })}
    </nav>
  );

  const widthClass = collapsed ? "lg:w-20" : "lg:w-64";
  const padClass = collapsed ? "lg:pl-20" : "lg:pl-64";

  return (
    <div className="app-canvas min-h-screen text-slate-900 dark:text-slate-100">
      <aside className={`fixed inset-y-0 left-0 z-40 hidden border-r border-slate-200/80 bg-white/90 p-4 shadow-card backdrop-blur duration-200 ease-out dark:border-slate-800 dark:bg-slate-900/90 lg:block lg:transition-[width] ${widthClass}`}>
        <div className="mb-6 flex items-center justify-between gap-2">
          {collapsed ? (
            <p className="text-sm font-semibold text-brand-700">CRM</p>
          ) : (
            <p className="text-lg font-semibold tracking-tight text-brand-700">CRM</p>
          )}
          <button type="button" onClick={() => setCollapsed((value) => !value)} className="rounded p-1 hover:bg-slate-100 dark:hover:bg-slate-800">
            {collapsed ? <PanelLeftOpen className="h-4 w-4" /> : <PanelLeftClose className="h-4 w-4" />}
          </button>
        </div>
        {nav}
      </aside>
      {drawer.shown ? (
        <div className={`drawer-backdrop fixed inset-0 z-50 lg:hidden${drawer.leaving ? " is-leaving" : ""}`}>
          <button type="button" className="absolute inset-0 bg-slate-900/40" aria-label="Close menu" onClick={() => setOpen(false)} />
          <aside className={`drawer-panel absolute inset-y-0 left-0 h-full w-64 bg-white p-5 shadow-xl dark:bg-slate-900${drawer.leaving ? " is-leaving" : ""}`}>
            <div className="mb-6 flex items-center justify-between">
              <p className="text-lg font-semibold tracking-tight text-brand-700">CRM</p>
              <button type="button" onClick={() => setOpen(false)}>
                <X className="h-5 w-5 text-slate-500" />
              </button>
            </div>
            {nav}
          </aside>
        </div>
      ) : null}
      <div className={`duration-200 ease-out lg:transition-[padding] ${padClass}`}>
        <header className="sticky top-0 z-30 flex items-center justify-between gap-3 border-b border-slate-200/80 bg-white/85 px-4 py-3 shadow-header backdrop-blur dark:border-slate-800 dark:bg-slate-900/85 sm:px-6">
          <div className="flex items-center gap-3">
            <button
              type="button"
              className="rounded-md p-1.5 text-slate-600 hover:bg-slate-100 lg:hidden"
              onClick={() => setOpen(true)}
              aria-label="Open menu"
            >
              <Menu className="h-5 w-5" />
            </button>
            {logoDataUrl ? <img src={logoDataUrl} alt="" className="h-8 w-8 rounded object-contain" /> : null}
            <div>
              <p className="text-sm font-semibold">{instituteName}</p>
              <Breadcrumbs />
            </div>
          </div>
          <div className="flex items-center gap-1">
            <kbd className="hidden rounded-lg border border-slate-200 px-2 py-1 text-[10px] font-medium text-slate-400 sm:inline dark:border-slate-700">
              Ctrl K
            </kbd>
            <ThemeToggle />
            <NotificationBell items={notifications} />
            <UserMenu name={user.name} email={user.email} role={role} />
          </div>
        </header>
        <div key={pathname} className="page-enter mx-auto max-w-7xl overflow-x-hidden p-4 sm:p-6 lg:p-8">
          {children}
        </div>
      </div>
      <CommandPalette role={role} />
    </div>
  );
};
