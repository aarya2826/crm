/** Session helpers and role gates for pages vs server actions. */
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import type { AppRole, UserPermissions } from "@/constants/roles";
import { permissionsFor } from "@/constants/roles";
import type { ActionResult } from "@/types/lead.types";

export interface SessionUser {
  id: string;
  name: string;
  email: string;
  role: AppRole;
}

export async function getSessionUser(): Promise<SessionUser | null> {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return null;
  }
  return session.user;
}

export async function requirePageRole(roles: AppRole[]): Promise<SessionUser> {
  const user = await getSessionUser();
  if (!user) {
    redirect("/login");
  }
  if (!roles.includes(user.role)) {
    redirect("/unauthorized");
  }
  return user;
}

export async function requireActionRole(
  roles: AppRole[]
): Promise<{ ok: true; user: SessionUser } | ({ ok: false } & ActionResult)> {
  const user = await getSessionUser();
  if (!user) {
    return { ok: false, success: false, error: "Please sign in to continue." };
  }
  if (!roles.includes(user.role)) {
    return { ok: false, success: false, error: "You do not have permission to do that." };
  }
  return { ok: true, user };
}

export function userPermissions(user: SessionUser): UserPermissions {
  return permissionsFor(user.role);
}
