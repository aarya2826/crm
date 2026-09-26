import type { UserRole } from "@prisma/client";

export type AppRole = UserRole;

export const ROLE_LABELS: Record<AppRole, string> = {
  ADMIN: "Admin",
  COUNSELOR: "Counselor",
  ACCOUNTANT: "Accountant",
  TEACHER: "Teacher",
};

export interface UserPermissions {
  canDelete: boolean;
  canEditLeads: boolean;
  canEditStudents: boolean;
  canRecordPayments: boolean;
  canManageSettings: boolean;
  canManageCourses: boolean;
  canMarkAttendance: boolean;
}

export function permissionsFor(role: AppRole): UserPermissions {
  return {
    canDelete: role === "ADMIN",
    canEditLeads: role === "ADMIN" || role === "COUNSELOR",
    canEditStudents: role === "ADMIN" || role === "COUNSELOR",
    canRecordPayments: role === "ADMIN" || role === "ACCOUNTANT",
    canManageSettings: role === "ADMIN",
    canManageCourses: role === "ADMIN",
    canMarkAttendance: role === "ADMIN" || role === "TEACHER",
  };
}

export interface NavItemConfig {
  href: string;
  label: string;
  roles: AppRole[];
}

export const NAV_ACCESS: NavItemConfig[] = [
  { href: "/", label: "Dashboard", roles: ["ADMIN", "COUNSELOR", "ACCOUNTANT", "TEACHER"] },
  { href: "/leads", label: "Leads", roles: ["ADMIN", "COUNSELOR"] },
  { href: "/students", label: "Students", roles: ["ADMIN", "COUNSELOR", "ACCOUNTANT", "TEACHER"] },
  { href: "/tasks", label: "Tasks", roles: ["ADMIN", "COUNSELOR", "ACCOUNTANT", "TEACHER"] },
  { href: "/attendance", label: "Attendance", roles: ["ADMIN", "TEACHER"] },
  { href: "/courses", label: "Courses", roles: ["ADMIN"] },
  { href: "/batches", label: "Batches", roles: ["ADMIN"] },
  { href: "/fees", label: "Fees", roles: ["ADMIN", "ACCOUNTANT"] },
  { href: "/reports", label: "Reports", roles: ["ADMIN", "COUNSELOR", "ACCOUNTANT"] },
  { href: "/settings", label: "Settings", roles: ["ADMIN"] },
];

export function canAccessPath(role: AppRole, pathname: string): boolean {
  if (pathname === "/unauthorized" || pathname === "/login") {
    return true;
  }

  const match = [...NAV_ACCESS]
    .sort((a, b) => b.href.length - a.href.length)
    .find((item) => (item.href === "/" ? pathname === "/" : pathname === item.href || pathname.startsWith(`${item.href}/`)));

  if (!match) {
    return role === "ADMIN";
  }

  return match.roles.includes(role);
}
