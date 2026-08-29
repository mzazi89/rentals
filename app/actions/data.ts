"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { requireProfile, requireUser } from "@/lib/auth/helpers";
import { assertRole } from "@/lib/permissions";
import type { Notification } from "@/types";

/* ------------------------------------------------------------------ */
/* Catalogue lookups (used by client components)                      */
/* ------------------------------------------------------------------ */
export async function getPropertyTypes() {
  return db<{ id: string; name: string }[]>`
    select id, name from property_types where is_active = true order by sort_order
  `;
}

export async function getLocations(type: "county" | "city" | "neighborhood" = "neighborhood") {
  const rows = await db<{ name: string }[]>`
    select name from locations where type = ${type} and is_active = true order by sort_order
  `;
  return rows.map((r) => r.name);
}

export async function getVerifiedAgentsOptions() {
  const rows = await db<{ id: string; name: string }[]>`
    select ag.id, coalesce(pr.full_name, 'Agent') as name
    from agents ag join profiles pr on pr.id = ag.id
    where ag.verification_status = 'verified'
    order by pr.full_name
  `;
  return rows;
}

/* ------------------------------------------------------------------ */
/* Notifications (bell + list)                                        */
/* ------------------------------------------------------------------ */
export async function getMyNotifications(limit = 10): Promise<{
  items: Notification[];
  unread: number;
}> {
  const user = await requireUser();
  const items = await db<Notification[]>`
    select * from notifications where user_id = ${user.id}
    order by created_at desc limit ${limit}
  `;
  const unreadRows = await db<{ total: number }[]>`
    select count(*)::int as total from notifications where user_id = ${user.id} and is_read = false
  `;
  return { items, unread: unreadRows[0]?.total ?? 0 };
}

export async function markAllNotificationsRead(): Promise<void> {
  const user = await requireUser();
  await db`update notifications set is_read = true where user_id = ${user.id} and is_read = false`;
  revalidatePath("/", "layout");
}

export async function markNotificationRead(id: string): Promise<void> {
  const user = await requireUser();
  await db`update notifications set is_read = true where id = ${id} and user_id = ${user.id}`;
}

/* ------------------------------------------------------------------ */
/* Reports                                                            */
/* ------------------------------------------------------------------ */
export type ReportRow = Record<string, string | number>;

export async function generateReport(
  type: string,
  scope: "agent" | "landlord" | "admin"
): Promise<ReportRow[]> {
  const profile = await requireProfile();
  assertRole(profile, scope === "admin" ? ["admin"] : scope === "agent" ? ["agent", "admin"] : ["landlord", "admin"]);

  if (scope === "agent") {
    const agentId = profile.id;
    if (type === "rent") {
      return db<ReportRow[]>`
        select p.title as "Property", rr.due_date as "Due date",
          rr.amount_due as "Amount due", rr.amount_paid as "Amount paid",
          (rr.amount_due - rr.amount_paid) as "Balance", rr.status as "Status"
        from rent_records rr join properties p on p.id = rr.property_id
        where p.agent_id = ${agentId}
        order by rr.due_date desc
      `;
    }
    if (type === "occupancy") {
      return db<ReportRow[]>`
        select title as "Property", status as "Status", monthly_rent as "Monthly rent", city as "Location"
        from properties where agent_id = ${agentId} order by created_at desc
      `;
    }
    if (type === "payment") {
      return db<ReportRow[]>`
        select pay.payment_reference as "Reference", p.title as "Property", pay.amount as "Amount",
          pay.payment_type as "Type", pay.status as "Status", pay.created_at as "Date"
        from payments pay join properties p on p.id = pay.property_id
        where p.agent_id = ${agentId} order by pay.created_at desc
      `;
    }
    if (type === "property") {
      return db<ReportRow[]>`
        select title as "Property", status as "Status", bedrooms as "Bedrooms",
          monthly_rent as "Monthly rent", created_at as "Created"
        from properties where agent_id = ${agentId} order by created_at desc
      `;
    }
    if (type === "commission") {
      return db<ReportRow[]>`
        select p.title as "Property", c.commission_type as "Type", c.commission_amount as "Amount",
          c.status as "Status", c.created_at as "Date"
        from commissions c left join properties p on p.id = c.property_id
        where c.agent_id = ${agentId} order by c.created_at desc
      `;
    }
    return [];
  }

  if (scope === "landlord") {
    const landlordId = profile.id;
    if (type === "rent") {
      return db<ReportRow[]>`
        select p.title as "Property", rr.due_date as "Due date", rr.amount_due as "Amount due",
          rr.amount_paid as "Amount paid", (rr.amount_due - rr.amount_paid) as "Balance", rr.status as "Status"
        from rent_records rr join properties p on p.id = rr.property_id
        where p.owner_id = ${landlordId}
        order by rr.due_date desc
      `;
    }
    if (type === "occupancy") {
      return db<ReportRow[]>`
        select title as "Property", status as "Status", monthly_rent as "Monthly rent"
        from properties where owner_id = ${landlordId} order by created_at desc
      `;
    }
    if (type === "payment") {
      return db<ReportRow[]>`
        select pay.payment_reference as "Reference", p.title as "Property", pay.amount as "Amount",
          pay.payment_type as "Type", pay.status as "Status", pay.created_at as "Date"
        from payments pay join properties p on p.id = pay.property_id
        where p.owner_id = ${landlordId} order by pay.created_at desc
      `;
    }
    return [];
  }

  // admin platform-wide reports
  if (type === "users") {
    return db<ReportRow[]>`
      select coalesce(full_name, '—') as "Name", email as "Email", coalesce(role, 'unassigned') as "Role",
        status as "Status", created_at as "Joined"
      from profiles order by created_at desc limit 500
    `;
  }
  if (type === "properties") {
    return db<ReportRow[]>`
      select title as "Title", status as "Status", monthly_rent as "Monthly rent", coalesce(city, '—') as "City", created_at as "Created"
      from properties order by created_at desc limit 500
    `;
  }
  if (type === "payments") {
    return db<ReportRow[]>`
      select payment_reference as "Reference", amount as "Amount", payment_type as "Type", status as "Status", created_at as "Date"
      from payments order by created_at desc limit 500
    `;
  }
  if (type === "commissions") {
    return db<ReportRow[]>`
      select commission_amount as "Amount", commission_type as "Type", status as "Status", created_at as "Date"
      from commissions order by created_at desc limit 500
    `;
  }
  return [];
}

/* ------------------------------------------------------------------ */
/* Admin analytics                                                    */
/* ------------------------------------------------------------------ */
export async function getAdminAnalytics(range: number): Promise<{
  users: { date: string; users: number; properties: number }[];
  payments: { date: string; payments: number; revenue: number }[];
}> {
  const profile = await requireProfile();
  assertRole(profile, ["admin"]);

  const since = new Date(Date.now() - range * 86400000).toISOString();

  const [userRows, propertyRows, paymentRows] = await Promise.all([
    db<{ d: string; n: number }[]>`
      select to_char(created_at, 'YYYY-MM-DD') as d, count(*)::int as n
      from profiles where created_at >= ${since} group by 1
    `,
    db<{ d: string; n: number }[]>`
      select to_char(created_at, 'YYYY-MM-DD') as d, count(*)::int as n
      from properties where created_at >= ${since} group by 1
    `,
    db<{ d: string; n: number; sum: number }[]>`
      select to_char(created_at, 'YYYY-MM-DD') as d, count(*)::int as n, coalesce(sum(amount), 0)::int as sum
      from payments where status = 'successful' and created_at >= ${since} group by 1
    `,
  ]);

  const userMap = new Map(userRows.map((r) => [r.d, r.n]));
  const propMap = new Map(propertyRows.map((r) => [r.d, r.n]));
  const payMap = new Map(paymentRows.map((r) => [r.d, { n: r.n, sum: r.sum }]));

  const days: string[] = [];
  for (let i = range - 1; i >= 0; i--) {
    days.push(new Date(Date.now() - i * 86400000).toISOString().slice(0, 10));
  }

  return {
    users: days.map((date) => ({ date, users: userMap.get(date) ?? 0, properties: propMap.get(date) ?? 0 })),
    payments: days.map((date) => ({
      date,
      payments: payMap.get(date)?.n ?? 0,
      revenue: Math.round((payMap.get(date)?.sum ?? 0) / 1000),
    })),
  };
}

/* ------------------------------------------------------------------ */
/* Conversations (client chat)                                        */
/* ------------------------------------------------------------------ */
export async function getConversationsList() {
  const user = await requireUser();
  const { fetchConversationsForUser } = await import("@/lib/db/queries");
  return fetchConversationsForUser(user.id);
}

export async function getConversationMessages(conversationId: string) {
  const user = await requireUser();
  const { fetchConversationMessages, fetchConversationPropertyTitle } = await import("@/lib/db/queries");
  // Membership gate
  const member = await db<{ conversation_id: string }[]>`
    select conversation_id from conversation_members
    where conversation_id = ${conversationId} and user_id = ${user.id}
  `;
  if (member.length === 0) return { messages: [], title: null };
  const [messages, title] = await Promise.all([
    fetchConversationMessages(conversationId),
    fetchConversationPropertyTitle(conversationId),
  ]);
  return { messages, title };
}
