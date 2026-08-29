"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { requireProfile } from "@/lib/auth/helpers";
import { isOwnerRole } from "@/lib/auth/helpers";
import { assertRole } from "@/lib/permissions";
import { createNotification } from "@/lib/notifications";
import { applicationCreateSchema, applicationReviewSchema } from "@/lib/validations";
import type { z } from "zod";

type ActionResult = { ok: true; [k: string]: unknown } | { ok: false; error: string };

/* ------------------------------------------------------------------ */
/* Tenant applies for a property                                      */
/* ------------------------------------------------------------------ */
export async function applyToProperty(values: z.infer<typeof applicationCreateSchema>): Promise<ActionResult> {
  const profile = await requireProfile();
  assertRole(profile, ["tenant", "owner", "admin"]);
  const parsed = applicationCreateSchema.safeParse(values);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };

  const property = await db<{ id: string; agent_id: string | null; status: string; title: string }[]>`
    select id, agent_id, status, title from properties where id = ${parsed.data.propertyId}
  `;
  const prop = property[0];
  if (!prop) return { ok: false, error: "Property not found." };
  if (prop.status !== "available") return { ok: false, error: "This property is not accepting applications." };

  // Duplicate active application check (DB also enforces this)
  const existing = await db<{ id: string }[]>`
    select id from applications
    where property_id = ${parsed.data.propertyId} and applicant_id = ${profile.id}
      and status in ('submitted', 'under_review', 'approved')
    limit 1
  `;
  if (existing.length > 0) return { ok: false, error: "You already have an active application for this property." };

  try {
    const inserted = await db<{ id: string }[]>`
      insert into applications (
        property_id, applicant_id, agent_id, full_name, phone, email, occupation,
        employer, monthly_income, number_of_occupants, preferred_move_in_date, notes, status
      ) values (
        ${parsed.data.propertyId}, ${profile.id}, ${prop.agent_id}, ${parsed.data.fullName},
        ${parsed.data.phone}, ${parsed.data.email}, ${parsed.data.occupation ?? null},
        ${parsed.data.employer ?? null}, ${parsed.data.monthlyIncome ?? null},
        ${parsed.data.numberofOccupants}, ${parsed.data.preferredMoveInDate || null},
        ${parsed.data.notes ?? null}, 'submitted'
      )
      returning id
    `;

    if (prop.agent_id) {
      await createNotification({
        userId: prop.agent_id,
        type: "application_submitted",
        title: "New application received",
        body: `${parsed.data.fullName} applied for ${prop.title}.`,
        link: "/dashboard/agent/applications",
      });
    }

    revalidatePath("/dashboard/tenant/applications");
    return { ok: true, applicationId: inserted[0]?.id };
  } catch (err) {
    const message = err instanceof Error ? err.message : "";
    if (message.includes("duplicate key")) {
      return { ok: false, error: "You already have an active application for this property." };
    }
    return { ok: false, error: message || "Could not submit application." };
  }
}

/* ------------------------------------------------------------------ */
/* Agent / landlord reviews an application                            */
/* ------------------------------------------------------------------ */
export async function reviewApplication(values: z.infer<typeof applicationReviewSchema>): Promise<ActionResult> {
  const profile = await requireProfile();
  assertRole(profile, ["agent", "landlord", "owner", "admin"]);
  const parsed = applicationReviewSchema.safeParse(values);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };

  const application = await db<
    { id: string; applicant_id: string; status: string; owner_id: string; agent_id: string | null; title: string }[]
  >`
    select a.id, a.applicant_id, a.status, p.owner_id, p.agent_id, p.title
    from applications a join properties p on p.id = a.property_id
    where a.id = ${parsed.data.applicationId}
  `;
  const app = application[0];
  if (!app) return { ok: false, error: "Application not found." };

  const isAgent = app.agent_id === profile.id;
  const isLandlord = app.owner_id === profile.id;
  if (!isAgent && !isLandlord && !isOwnerRole(profile.role)) {
    return { ok: false, error: "You do not have permission to review this application." };
  }

  const statusMap: Record<string, string> = {
    approve: "approved",
    reject: "rejected",
    under_review: "under_review",
  };
  const status = statusMap[parsed.data.action];
  if (!status) return { ok: false, error: "Invalid action." };

  await db`
    update applications set status = ${status}, reviewed_by = ${profile.id}, reviewed_at = ${new Date().toISOString()}
    where id = ${app.id}
  `;

  await createNotification({
    userId: app.applicant_id,
    type: status === "approved" ? "application_approved" : "application_rejected",
    title: status === "approved" ? "Application approved" : "Application not approved",
    body: `Your application for ${app.title} was ${status}.`,
    link: "/dashboard/tenant/applications",
  });

  revalidatePath("/dashboard/agent/applications");
  revalidatePath("/dashboard/tenant/applications");
  return { ok: true, status };
}

/* ------------------------------------------------------------------ */
/* Tenant withdraws their own application                             */
/* ------------------------------------------------------------------ */
export async function withdrawApplication(applicationId: string): Promise<ActionResult> {
  const profile = await requireProfile();
  assertRole(profile, ["tenant", "owner", "admin"]);

  const application = await db<{ id: string; status: string }[]>`
    select id, status from applications where id = ${applicationId} and applicant_id = ${profile.id}
  `;
  const app = application[0];
  if (!app) return { ok: false, error: "Application not found." };
  if (!["submitted", "under_review"].includes(app.status)) {
    return { ok: false, error: "This application can no longer be withdrawn." };
  }

  await db`update applications set status = 'withdrawn' where id = ${applicationId}`;
  revalidatePath("/dashboard/tenant/applications");
  return { ok: true };
}
