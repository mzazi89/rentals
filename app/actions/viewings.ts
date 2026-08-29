"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { requireProfile } from "@/lib/auth/helpers";
import { assertRole } from "@/lib/permissions";
import { createNotification } from "@/lib/notifications";
import { viewingCreateSchema, viewingManageSchema } from "@/lib/validations";
import type { z } from "zod";

type ActionResult = { ok: true; [k: string]: unknown } | { ok: false; error: string };

/* ------------------------------------------------------------------ */
/* Tenant books a viewing                                             */
/* ------------------------------------------------------------------ */
export async function bookViewing(values: z.infer<typeof viewingCreateSchema>): Promise<ActionResult> {
  const profile = await requireProfile();
  assertRole(profile, ["tenant", "owner", "admin"]);
  const parsed = viewingCreateSchema.safeParse(values);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };

  const scheduledAt = new Date(parsed.data.scheduledAt);
  if (Number.isNaN(scheduledAt.getTime())) return { ok: false, error: "Invalid date." };
  if (scheduledAt.getTime() < Date.now()) return { ok: false, error: "Viewing must be in the future." };

  const property = await db<{ id: string; agent_id: string | null; status: string }[]>`
    select id, agent_id, status from properties where id = ${parsed.data.propertyId}
  `;
  const prop = property[0];
  if (!prop) return { ok: false, error: "Property not found." };
  if (prop.status !== "available") return { ok: false, error: "This property is not available for viewings." };
  if (!prop.agent_id) return { ok: false, error: "This property has no assigned agent." };

  // Prevent double-booking the same agent at the same time
  const clash = await db<{ id: string }[]>`
    select id from viewings
    where agent_id = ${prop.agent_id} and scheduled_at = ${scheduledAt.toISOString()}
      and status in ('pending', 'confirmed', 'rescheduled')
    limit 1
  `;
  if (clash.length > 0) return { ok: false, error: "That time slot is already booked. Please pick another." };

  try {
    const inserted = await db<{ id: string }[]>`
      insert into viewings (property_id, tenant_id, agent_id, scheduled_at, tenant_message, status)
      values (${parsed.data.propertyId}, ${profile.id}, ${prop.agent_id}, ${scheduledAt.toISOString()},
        ${parsed.data.tenantMessage ?? null}, 'pending')
      returning id
    `;

    await createNotification({
      userId: prop.agent_id,
      type: "viewing_request",
      title: "New viewing request",
      body: `A tenant requested a viewing for ${scheduledAt.toLocaleString("en-KE", { dateStyle: "medium", timeStyle: "short" })}.`,
      link: "/dashboard/agent/viewings",
    });

    revalidatePath("/dashboard/tenant/viewings");
    return { ok: true, viewingId: inserted[0]?.id };
  } catch (err) {
    const message = err instanceof Error ? err.message : "";
    if (message.includes("duplicate key")) {
      return { ok: false, error: "That time slot is already booked. Please pick another." };
    }
    return { ok: false, error: message || "Could not book viewing." };
  }
}

/* ------------------------------------------------------------------ */
/* Agent / tenant manage a viewing                                    */
/* ------------------------------------------------------------------ */
export async function manageViewing(values: z.infer<typeof viewingManageSchema>): Promise<ActionResult> {
  const profile = await requireProfile();
  const parsed = viewingManageSchema.safeParse(values);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };

  const viewing = await db<{ id: string; agent_id: string | null; tenant_id: string; status: string }[]>`
    select id, agent_id, tenant_id, status from viewings where id = ${parsed.data.viewingId}
  `;
  const v = viewing[0];
  if (!v) return { ok: false, error: "Viewing not found." };

  const isAgent = v.agent_id === profile.id;
  const isTenant = v.tenant_id === profile.id;
  const isAdmin = profile.role === "admin";
  if (!isAgent && !isTenant && !isAdmin) return { ok: false, error: "You do not have permission." };

  const { action } = parsed.data;
  let patch = "";
  const params: unknown[] = [];

  const setCol = (sql: string, val: unknown) => {
    params.push(val);
    return sql.replace("?", `$${params.length}`);
  };

  if (action === "confirm") {
    if (!isAgent && !isAdmin) return { ok: false, error: "Only the agent can confirm viewings." };
    patch = `status = 'confirmed', agent_message = ${setCol("?", parsed.data.agentMessage ?? null)}`;
  } else if (action === "reject") {
    if (!isAgent && !isAdmin) return { ok: false, error: "Only the agent can reject viewings." };
    patch = `status = 'cancelled', agent_message = ${setCol("?", parsed.data.agentMessage ?? "Viewing declined by the agent.")}`;
  } else if (action === "complete") {
    if (!isAgent && !isAdmin) return { ok: false, error: "Only the agent can complete viewings." };
    patch = "status = 'completed'";
  } else if (action === "no_show") {
    if (!isAgent && !isAdmin) return { ok: false, error: "Only the agent can mark a no-show." };
    patch = "status = 'no_show'";
  } else if (action === "cancel") {
    if (!isTenant && !isAdmin) return { ok: false, error: "Only the tenant can cancel their viewing." };
    if (!["pending", "confirmed"].includes(v.status)) {
      return { ok: false, error: "This viewing can no longer be cancelled." };
    }
    patch = "status = 'cancelled'";
  } else if (action === "reschedule") {
    if (!isAgent && !isAdmin) return { ok: false, error: "Only the agent can reschedule viewings." };
    if (!parsed.data.rescheduleAt) return { ok: false, error: "Pick a new date and time." };
    const newTime = new Date(parsed.data.rescheduleAt);
    if (Number.isNaN(newTime.getTime())) return { ok: false, error: "Invalid date." };
    const clash = await db<{ id: string }[]>`
      select id from viewings
      where agent_id = ${v.agent_id} and scheduled_at = ${newTime.toISOString()}
        and status in ('pending', 'confirmed', 'rescheduled') and id <> ${v.id}
      limit 1
    `;
    if (clash.length > 0) return { ok: false, error: "That time slot is already booked." };
    patch = `status = 'rescheduled', scheduled_at = ${setCol("?", newTime.toISOString())}, agent_message = ${setCol("?", parsed.data.agentMessage ?? null)}`;
  }

  if (!patch) return { ok: false, error: "Invalid action." };

  const valuesList = [...params, v.id];
  await db.unsafe(
    `update viewings set ${patch} where id = $${valuesList.length}`,
    valuesList as never[]
  );

  // Notifications
  const targetUserId = isAgent || isAdmin ? v.tenant_id : v.agent_id;
  const isTargetAgent = targetUserId === v.agent_id;
  const titles: Record<string, string> = {
    confirmed: "Viewing confirmed",
    cancelled: "Viewing cancelled",
    completed: "Viewing completed",
    no_show: "Marked as no-show",
    rescheduled: "Viewing rescheduled",
  };
  if (targetUserId) {
    await createNotification({
      userId: targetUserId,
      type: "viewing_confirmation",
      title: titles[action] ?? "Viewing updated",
      body: `Your viewing has been ${action.replace("_", " ")}.`,
      link: isTargetAgent ? "/dashboard/agent/viewings" : "/dashboard/tenant/viewings",
    });
  }

  revalidatePath("/dashboard/agent/viewings");
  revalidatePath("/dashboard/tenant/viewings");
  return { ok: true };
}
