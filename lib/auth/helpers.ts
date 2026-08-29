import "server-only";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import type { Profile, Role } from "@/types";

export type AuthUser = {
  id: string;
  email: string;
};

/** Current authenticated user (or null). Does not redirect. */
export async function getCurrentUser(): Promise<AuthUser | null> {
  const session = await auth.api.getSession({ headers: headers() });
  if (!session?.user) return null;
  return { id: session.user.id, email: session.user.email };
}

/** Current user profile row (or null). */
export async function getCurrentProfile(): Promise<Profile | null> {
  const user = await getCurrentUser();
  if (!user) return null;
  const rows = await db<Profile[]>`
    select id, email, full_name, phone, avatar_url, role, status, is_onboarded, created_at, updated_at
    from profiles where id = ${user.id}
  `;
  return rows[0] ?? null;
}

/** Require an authenticated user; redirect to /login otherwise. */
export async function requireUser(): Promise<AuthUser> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  return user;
}

/** Require an authenticated user with an active profile. */
export async function requireProfile(): Promise<Profile> {
  const user = await requireUser();
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login");
  if (profile.status === "suspended") redirect("/account-suspended");
  return profile;
}

/** Require one of the given roles (server-side). */
export async function requireRole(allowed: Role[]): Promise<Profile> {
  const profile = await requireProfile();
  if (!profile.role || !allowed.includes(profile.role)) {
    redirect(dashboardPathForRole(profile.role) ?? "/forbidden");
  }
  return profile;
}

export function dashboardPathForRole(role: Role | null | undefined): string | null {
  switch (role) {
    case "tenant":
      return "/dashboard/tenant";
    case "agent":
      return "/dashboard/agent";
    case "landlord":
      return "/dashboard/landlord";
    case "admin":
      return "/admin";
    default:
      return null;
  }
}

/** Redirect a signed-in user to their role's dashboard (used by /dashboard). */
export function redirectToDashboard(role: Role | null | undefined): never {
  const path = dashboardPathForRole(role);
  redirect(path ?? "/signup/role");
}

export async function isAdminProfile(profile: Profile): Promise<boolean> {
  return profile.role === "admin" && profile.status === "active";
}
