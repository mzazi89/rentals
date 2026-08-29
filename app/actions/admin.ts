"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { requireProfile } from "@/lib/auth/helpers";
import { audit } from "@/lib/audit";
import { createNotification } from "@/lib/notifications";
import {
  adminVerifyAgentSchema,
  adminPropertyDecisionSchema,
  adminUserEditSchema,
} from "@/lib/validations";
import type { z } from "zod";

type ActionResult = { ok: true; [k: string]: unknown } | { ok: false; error: string };

/** Hard server-side admin guard. Redirects non-admins. */
async function requireAdmin() {
  const profile = await requireProfile();
  if (profile.role !== "admin") redirect("/forbidden");
  return profile;
}

/* ------------------------------------------------------------------ */
/* Agent verification                                                 */
/* ------------------------------------------------------------------ */
export async function verifyAgent(values: z.infer<typeof adminVerifyAgentSchema>): Promise<ActionResult> {
  await requireAdmin();
  const parsed = adminVerifyAgentSchema.safeParse(values);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };

  const statusMap = { approve: "verified", reject: "rejected", request_info: "info_requested" } as const;
  const status = statusMap[parsed.data.action];

  await db`
    update agents set verification_status = ${status}, verification_notes = ${parsed.data.note ?? null}
    where id = ${parsed.data.agentId}
  `;

  await createNotification({
    userId: parsed.data.agentId,
    type: "agent_verification",
    title: status === "verified" ? "You're verified!" : "Verification update",
    body:
      status === "verified"
        ? "Your agent profile has been verified. You can now list properties."
        : parsed.data.note ?? "Your verification status changed.",
    link: "/dashboard/agent/profile",
  });

  await audit("agent_verification", "agents", parsed.data.agentId, {
    status,
    note: parsed.data.note ?? null,
  });
  revalidatePath("/admin/agents");
  return { ok: true };
}

/* ------------------------------------------------------------------ */
/* Property approval / rejection                                      */
/* ------------------------------------------------------------------ */
export async function decideProperty(
  values: z.infer<typeof adminPropertyDecisionSchema>
): Promise<ActionResult> {
  await requireAdmin();
  const parsed = adminPropertyDecisionSchema.safeParse(values);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };

  const property = await db<{ id: string; title: string; agent_id: string | null; owner_id: string }[]>`
    select id, title, agent_id, owner_id from properties where id = ${parsed.data.propertyId}
  `;
  const prop = property[0];
  if (!prop) return { ok: false, error: "Property not found." };

  if (parsed.data.action === "approve") {
    await db`
      update properties set status = 'available', verified = true, rejection_reason = null
      where id = ${prop.id}
    `;
  } else if (parsed.data.action === "reject") {
    await db`
      update properties set status = 'rejected', verified = false, rejection_reason = ${parsed.data.note ?? "Listing rejected."}
      where id = ${prop.id}
    `;
  } else {
    // request_changes → back to draft so the agent can edit & resubmit
    await db`
      update properties set status = 'draft', verified = false, rejection_reason = ${parsed.data.note ?? "Changes requested."}
      where id = ${prop.id}
    `;
  }

  const notifyUserId = prop.agent_id ?? prop.owner_id;
  if (notifyUserId) {
    await createNotification({
      userId: notifyUserId,
      type: "property_approval",
      title:
        parsed.data.action === "approve"
          ? "Property approved"
          : parsed.data.action === "reject"
            ? "Property rejected"
            : "Changes requested",
      body: `${prop.title} — ${parsed.data.note ?? ""}`,
      link: "/dashboard/agent/properties",
    });
  }

  await audit("property_decision", "properties", prop.id, {
    action: parsed.data.action,
    note: parsed.data.note ?? null,
  });
  revalidatePath("/admin/properties");
  revalidatePath("/properties");
  return { ok: true };
}

/* ------------------------------------------------------------------ */
/* User management                                                    */
/* ------------------------------------------------------------------ */
export async function suspendUser(userId: string): Promise<ActionResult> {
  const admin = await requireAdmin();
  if (admin.id === userId) return { ok: false, error: "You cannot suspend your own account." };

  await db`update profiles set status = 'suspended' where id = ${userId}`;
  await audit("user_suspended", "profiles", userId);
  revalidatePath("/admin/users");
  return { ok: true };
}

export async function reactivateUser(userId: string): Promise<ActionResult> {
  await requireAdmin();
  await db`update profiles set status = 'active' where id = ${userId}`;
  await audit("user_reactivated", "profiles", userId);
  revalidatePath("/admin/users");
  return { ok: true };
}

export async function deleteUser(userId: string): Promise<ActionResult> {
  const admin = await requireAdmin();
  if (admin.id === userId) return { ok: false, error: "You cannot delete your own account." };

  // Block deleting users with active leases
  const leases = await db<{ id: string }[]>`
    select id from leases
    where (tenant_id = ${userId} or agent_id = ${userId} or landlord_id = ${userId})
      and status in ('pending', 'active')
    limit 1
  `;
  if (leases.length > 0) {
    return { ok: false, error: "This user has active leases. Deactivate the leases first." };
  }

  try {
    await db`delete from "user" where id = ${userId}`;
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Could not delete user." };
  }
  await audit("user_deleted", "profiles", userId);
  revalidatePath("/admin/users");
  return { ok: true };
}

export async function editUser(values: z.infer<typeof adminUserEditSchema>): Promise<ActionResult> {
  await requireAdmin();
  const parsed = adminUserEditSchema.safeParse(values);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };

  await db`
    update profiles set full_name = ${parsed.data.fullName}, phone = ${parsed.data.phone ?? null}
    where id = ${parsed.data.userId}
  `;
  await db`update "user" set name = ${parsed.data.fullName} where id = ${parsed.data.userId}`;
  await audit("user_edited", "profiles", parsed.data.userId);
  revalidatePath("/admin/users");
  return { ok: true };
}

/* ------------------------------------------------------------------ */
/* Reports / reviews moderation                                       */
/* ------------------------------------------------------------------ */
export async function resolveReport(input: {
  reportId: string;
  status: "open" | "investigating" | "resolved" | "dismissed";
  adminNotes?: string;
}): Promise<ActionResult> {
  await requireAdmin();
  await db`
    update reports set status = ${input.status}, admin_notes = ${input.adminNotes ?? null}
    where id = ${input.reportId}
  `;
  await audit("report_resolved", "reports", input.reportId, { status: input.status });
  revalidatePath("/admin/flags");
  return { ok: true };
}

export async function moderateReview(input: { reviewId: string; action: "approve" | "hide" }): Promise<ActionResult> {
  await requireAdmin();
  await db`
    update reviews set status = ${input.action === "approve" ? "approved" : "hidden"}
    where id = ${input.reviewId}
  `;
  await audit("review_moderated", "reviews", input.reviewId, { action: input.action });
  revalidatePath("/admin/reviews");
  return { ok: true };
}

/* ------------------------------------------------------------------ */
/* Commissions                                                        */
/* ------------------------------------------------------------------ */
export async function updateCommissionStatus(input: {
  commissionId: string;
  status: "pending" | "approved" | "paid" | "cancelled";
}): Promise<ActionResult> {
  await requireAdmin();
  await db`update commissions set status = ${input.status} where id = ${input.commissionId}`;
  await audit("commission_changed", "commissions", input.commissionId, { status: input.status });
  revalidatePath("/admin/commissions");
  return { ok: true };
}

/* ------------------------------------------------------------------ */
/* Platform settings                                                  */
/* ------------------------------------------------------------------ */
export async function savePlatformSettings(
  settings: Record<string, string | number | boolean>
): Promise<ActionResult> {
  const admin = await requireAdmin();

  for (const [key, value] of Object.entries(settings)) {
    await db`
      insert into platform_settings (key, value, description, updated_by, updated_at)
      values (${key}, ${JSON.stringify(value)}::jsonb, null, ${admin.id}, ${new Date().toISOString()})
      on conflict (key) do update set
        value = excluded.value, updated_by = excluded.updated_by, updated_at = excluded.updated_at
    `;
  }
  await audit("settings_changed", "platform_settings", null, { keys: Object.keys(settings) });
  revalidatePath("/admin/settings");
  revalidatePath("/", "layout");
  return { ok: true };
}

export async function setFeaturedProperty(input: { propertyId: string; featured: boolean }): Promise<ActionResult> {
  await requireAdmin();
  await db`update properties set featured = ${input.featured} where id = ${input.propertyId}`;
  await audit("property_featured", "properties", input.propertyId, { featured: input.featured });
  revalidatePath("/admin/properties");
  revalidatePath("/");
  return { ok: true };
}

/* ------------------------------------------------------------------ */
/* Catalogue management (types / amenities / locations)               */
/* ------------------------------------------------------------------ */
export async function managePropertyType(input: {
  action: "create" | "update" | "delete";
  id?: string;
  name?: string;
  description?: string;
  icon?: string;
  sortOrder?: number;
  isActive?: boolean;
}): Promise<ActionResult> {
  await requireAdmin();
  if (input.action === "create") {
    if (!input.name) return { ok: false, error: "Name is required." };
    const slug = input.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
    await db`
      insert into property_types (name, slug, description, icon, sort_order)
      values (${input.name ?? ""}, ${slug}, ${input.description ?? null}, ${input.icon ?? null}, ${input.sortOrder ?? 0})
    `;
  } else if (input.action === "update" && input.id) {
    await db`
      update property_types set
        name = ${input.name ?? ""}, description = ${input.description ?? null}, icon = ${input.icon ?? null},
        sort_order = ${input.sortOrder ?? 0}, is_active = ${input.isActive ?? true}
      where id = ${input.id}
    `;
  } else if (input.action === "delete" && input.id) {
    try {
      await db`delete from property_types where id = ${input.id}`;
    } catch {
      return { ok: false, error: "Cannot delete: it may be in use." };
    }
  }
  await audit("catalogue_changed", "property_types", input.id ?? null, { action: input.action });
  revalidatePath("/admin/settings");
  return { ok: true };
}

export async function manageAmenity(input: {
  action: "create" | "update" | "delete";
  id?: string;
  name?: string;
  category?: string;
  icon?: string;
  isActive?: boolean;
}): Promise<ActionResult> {
  await requireAdmin();
  if (input.action === "create") {
    if (!input.name) return { ok: false, error: "Name is required." };
    await db`
      insert into amenities (name, category, icon)
      values (${input.name ?? ""}, ${input.category ?? null}, ${input.icon ?? null})
    `;
  } else if (input.action === "update" && input.id) {
    await db`
      update amenities set name = ${input.name ?? ""}, category = ${input.category ?? null}, icon = ${input.icon ?? null}, is_active = ${input.isActive ?? true}
      where id = ${input.id}
    `;
  } else if (input.action === "delete" && input.id) {
    try {
      await db`delete from amenities where id = ${input.id}`;
    } catch {
      return { ok: false, error: "Cannot delete: it may be in use." };
    }
  }
  await audit("catalogue_changed", "amenities", input.id ?? null, { action: input.action });
  revalidatePath("/admin/settings");
  return { ok: true };
}

export async function manageLocation(input: {
  action: "create" | "update" | "delete";
  id?: string;
  name?: string;
  type?: "county" | "city" | "neighborhood";
  isActive?: boolean;
}): Promise<ActionResult> {
  await requireAdmin();
  if (input.action === "create") {
    if (!input.name || !input.type) return { ok: false, error: "Name and type are required." };
    const slug = input.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
    await db`insert into locations (name, type, slug) values (${input.name ?? ""}, ${input.type}, ${slug})`;
  } else if (input.action === "update" && input.id) {
    await db`
      update locations set name = ${input.name ?? ""}, is_active = ${input.isActive ?? true}
      where id = ${input.id}
    `;
  } else if (input.action === "delete" && input.id) {
    try {
      await db`delete from locations where id = ${input.id}`;
    } catch {
      return { ok: false, error: "Cannot delete: it may be in use." };
    }
  }
  await audit("catalogue_changed", "locations", input.id ?? null, { action: input.action });
  revalidatePath("/admin/settings");
  return { ok: true };
}
