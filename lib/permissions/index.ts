import "server-only";

import { db } from "@/db";
import type { Profile, Role } from "@/types";

/** Server-side assertion that the profile holds one of the roles. */
export function assertRole(
  profile: Profile,
  allowed: Role[]
): asserts profile is Profile & { role: Role } {
  if (!profile.role || !allowed.includes(profile.role)) {
    throw new Error("FORBIDDEN");
  }
}

/** Can this profile manage a specific property (owner / assigned agent / admin)? */
export async function canManageProperty(
  profile: Profile,
  propertyId: string
): Promise<boolean> {
  if (profile.role === "admin") return true;
  const rows = await db<{ id: string }[]>`
    select id from properties
    where id = ${propertyId} and (owner_id = ${profile.id} or agent_id = ${profile.id})
  `;
  return rows.length > 0;
}

/** Is this profile's agent record verified? */
export async function isVerifiedAgent(profileId: string): Promise<boolean> {
  const rows = await db<{ verification_status: string }[]>`
    select verification_status from agents where id = ${profileId}
  `;
  return rows[0]?.verification_status === "verified";
}
