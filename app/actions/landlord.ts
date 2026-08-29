"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { requireProfile, isOwnerRole } from "@/lib/auth/helpers";
import { assertRole } from "@/lib/permissions";
import { createNotification } from "@/lib/notifications";
import { audit } from "@/lib/audit";
import { z } from "zod";

type ActionResult = { ok: true; [k: string]: unknown } | { ok: false; error: string };

const assignAgentSchema = z.object({
  propertyId: z.string().uuid(),
  agentId: z.string().uuid(),
});

/** Landlord assigns a verified agent to one of their properties. */
export async function assignAgentToProperty(
  values: z.infer<typeof assignAgentSchema>
): Promise<ActionResult> {
  const profile = await requireProfile();
  assertRole(profile, ["landlord", "owner", "admin"]);
  const parsed = assignAgentSchema.safeParse(values);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };

  // The landlord must own the property
  const property = await db<{ id: string; owner_id: string; title: string }[]>`
    select id, owner_id, title from properties where id = ${parsed.data.propertyId}
  `;
  const prop = property[0];
  if (!prop) return { ok: false, error: "Property not found." };
  if (prop.owner_id !== profile.id && !isOwnerRole(profile.role)) {
    return { ok: false, error: "You do not own this property." };
  }

  // The target must be a verified agent
  const agent = await db<{ verification_status: string }[]>`
    select verification_status from agents where id = ${parsed.data.agentId}
  `;
  if (!agent[0] || agent[0].verification_status !== "verified") {
    return { ok: false, error: "The selected user is not a verified agent." };
  }

  await db`update properties set agent_id = ${parsed.data.agentId} where id = ${parsed.data.propertyId}`;

  await createNotification({
    userId: parsed.data.agentId,
    type: "system_announcement",
    title: "New property assigned",
    body: `You've been assigned to manage "${prop.title}".`,
    link: "/dashboard/agent/properties",
  });

  await audit("agent_assigned", "properties", prop.id, { agent: parsed.data.agentId });
  revalidatePath("/dashboard/landlord/properties");
  return { ok: true };
}
