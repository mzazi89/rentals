"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { requireProfile } from "@/lib/auth/helpers";
import { assertRole } from "@/lib/permissions";
import { reviewCreateSchema } from "@/lib/validations";
import type { z } from "zod";

type ActionResult = { ok: true; [k: string]: unknown } | { ok: false; error: string };

/**
 * A tenant can review an agent only after a legitimate interaction:
 * an active/expired/terminated lease with that agent, or a completed viewing.
 * Reviews are created as "pending" and must be approved by an admin.
 */
export async function createReview(values: z.infer<typeof reviewCreateSchema>): Promise<ActionResult> {
  const profile = await requireProfile();
  assertRole(profile, ["tenant", "admin"]);
  const parsed = reviewCreateSchema.safeParse(values);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };

  // Legitimacy check
  const lease = await db<{ id: string }[]>`
    select id from leases
    where tenant_id = ${profile.id} and agent_id = ${parsed.data.agentId}
      and status in ('active', 'expired', 'terminated')
    limit 1
  `;
  const viewing = await db<{ id: string }[]>`
    select id from viewings
    where tenant_id = ${profile.id} and agent_id = ${parsed.data.agentId} and status = 'completed'
    limit 1
  `;

  if (lease.length === 0 && viewing.length === 0) {
    return { ok: false, error: "You can only review an agent after a completed viewing or lease." };
  }

  try {
    await db`
      insert into reviews (reviewer_id, agent_id, property_id, lease_id, rating, comment, status)
      values (${profile.id}, ${parsed.data.agentId}, ${parsed.data.propertyId ?? null},
        ${lease[0]?.id ?? null}, ${parsed.data.rating}, ${parsed.data.comment}, 'pending')
    `;
  } catch (err) {
    const message = err instanceof Error ? err.message : "";
    if (message.includes("duplicate key")) {
      return { ok: false, error: "You have already reviewed this agent." };
    }
    return { ok: false, error: message || "Could not submit review." };
  }

  revalidatePath(`/agents/${parsed.data.agentId}`);
  return { ok: true };
}
