"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { requireProfile } from "@/lib/auth/helpers";
import { isOwnerRole } from "@/lib/auth/helpers";
import { createNotification } from "@/lib/notifications";
import { messageSendSchema, conversationCreateSchema } from "@/lib/validations";
import type { z } from "zod";

type ActionResult = { ok: true; [k: string]: unknown } | { ok: false; error: string };

/**
 * Start (or find) a tenant↔agent conversation for a property.
 * Tenants may only message the agent managing the property they're viewing.
 */
export async function startConversation(
  values: z.infer<typeof conversationCreateSchema>
): Promise<ActionResult> {
  const profile = await requireProfile();
  const parsed = conversationCreateSchema.safeParse(values);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };

  const property = await db<{ id: string; agent_id: string | null; title: string }[]>`
    select id, agent_id, title from properties where id = ${parsed.data.propertyId}
  `;
  const prop = property[0];
  if (!prop) return { ok: false, error: "Property not found." };
  if (prop.agent_id !== parsed.data.agentId && !isOwnerRole(profile.role)) {
    return { ok: false, error: "You can only message the agent managing this property." };
  }
  if (prop.agent_id === profile.id) {
    return { ok: false, error: "You cannot start a conversation with yourself." };
  }

  // Find existing conversation between these two users
  const existing = await db<{ conversation_id: string }[]>`
    select cm1.conversation_id
    from conversation_members cm1
    join conversation_members cm2 on cm2.conversation_id = cm1.conversation_id
    where cm1.user_id = ${profile.id} and cm2.user_id = ${parsed.data.agentId}
    limit 1
  `;
  if (existing[0]) {
    return { ok: true, conversationId: existing[0].conversation_id };
  }

  const conv = await db<{ id: string }[]>`
    insert into conversations (property_id) values (${prop.id}) returning id
  `;
  const conversationId = conv[0]?.id;
  if (!conversationId) return { ok: false, error: "Could not start conversation." };

  await db`
    insert into conversation_members (conversation_id, user_id) values
      (${conversationId}, ${profile.id}),
      (${conversationId}, ${parsed.data.agentId})
  `;

  return { ok: true, conversationId };
}

/* ------------------------------------------------------------------ */
/* Send a message (membership-checked)                                */
/* ------------------------------------------------------------------ */
export async function sendMessage(values: z.infer<typeof messageSendSchema>): Promise<ActionResult> {
  const profile = await requireProfile();
  const parsed = messageSendSchema.safeParse(values);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };

  // Explicit membership check
  const membership = await db<{ conversation_id: string }[]>`
    select conversation_id from conversation_members
    where conversation_id = ${parsed.data.conversationId} and user_id = ${profile.id}
  `;
  if (membership.length === 0) {
    return { ok: false, error: "You do not have access to this conversation." };
  }

  const inserted = await db<{ id: string }[]>`
    insert into messages (conversation_id, sender_id, body)
    values (${parsed.data.conversationId}, ${profile.id}, ${parsed.data.body})
    returning id
  `;

  const now = new Date().toISOString();
  await db`
    update conversations set last_message_at = ${now} where id = ${parsed.data.conversationId}
  `;

  // Increment unread for the other member + notify
  const otherMember = await db<{ user_id: string; unread_count: number }[]>`
    select user_id, unread_count from conversation_members
    where conversation_id = ${parsed.data.conversationId} and user_id <> ${profile.id}
  `;
  if (otherMember[0]) {
    await db`
      update conversation_members set unread_count = ${(otherMember[0].unread_count ?? 0) + 1}
      where conversation_id = ${parsed.data.conversationId} and user_id = ${otherMember[0].user_id}
    `;
    const sender = await db<{ full_name: string | null }[]>`select full_name from profiles where id = ${profile.id}`;
    await createNotification({
      userId: otherMember[0].user_id,
      type: "new_message",
      title: "New message",
      body: `${sender[0]?.full_name ?? "Someone"}: ${parsed.data.body.slice(0, 80)}`,
      link: "/dashboard/agent/messages",
    });
  }

  revalidatePath("/dashboard/tenant/messages");
  revalidatePath("/dashboard/agent/messages");
  return { ok: true, messageId: inserted[0]?.id };
}

/* ------------------------------------------------------------------ */
/* Mark a conversation read                                            */
/* ------------------------------------------------------------------ */
export async function markConversationRead(conversationId: string): Promise<ActionResult> {
  const profile = await requireProfile();

  const membership = await db<{ conversation_id: string }[]>`
    select conversation_id from conversation_members
    where conversation_id = ${conversationId} and user_id = ${profile.id}
  `;
  if (membership.length === 0) {
    return { ok: false, error: "You do not have access to this conversation." };
  }

  await db`
    update conversation_members set unread_count = 0, last_read_at = ${new Date().toISOString()}
    where conversation_id = ${conversationId} and user_id = ${profile.id}
  `;
  await db`
    update messages set is_read = true, read_at = ${new Date().toISOString()}
    where conversation_id = ${conversationId} and sender_id <> ${profile.id} and is_read = false
  `;
  return { ok: true };
}
