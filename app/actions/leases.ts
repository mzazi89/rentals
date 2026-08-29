"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { requireProfile } from "@/lib/auth/helpers";
import { assertRole } from "@/lib/permissions";
import { createRentRecordsForLease } from "@/lib/rent";
import { createNotification } from "@/lib/notifications";
import { audit } from "@/lib/audit";
import { leaseCreateSchema } from "@/lib/validations";
import type { z } from "zod";

type ActionResult = { ok: true; [k: string]: unknown } | { ok: false; error: string };

/**
 * Create a lease from an approved application.
 * Sets the property to occupied and generates monthly rent records.
 */
export async function createLease(values: z.infer<typeof leaseCreateSchema>): Promise<ActionResult> {
  const profile = await requireProfile();
  assertRole(profile, ["agent", "landlord", "admin"]);
  const parsed = leaseCreateSchema.safeParse(values);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };

  const application = await db<
    {
      id: string;
      applicant_id: string;
      status: string;
      owner_id: string;
      agent_id: string | null;
      title: string;
    }[]
  >`
    select a.id, a.applicant_id, a.status, p.owner_id, p.agent_id, p.title
    from applications a join properties p on p.id = a.property_id
    where a.id = ${parsed.data.applicationId}
  `;
  const app = application[0];
  if (!app) return { ok: false, error: "Application not found." };
  if (app.status !== "approved") {
    return { ok: false, error: "Only approved applications can be converted to a lease." };
  }

  const isAgent = app.agent_id === profile.id;
  const isLandlord = app.owner_id === profile.id;
  if (!isAgent && !isLandlord && profile.role !== "admin") {
    return { ok: false, error: "You do not have permission to create a lease for this property." };
  }

  // Guard: no active lease for this tenant+property already
  const clash = await db<{ id: string }[]>`
    select id from leases
    where property_id = ${app.id} and tenant_id = ${app.applicant_id} and status in ('pending', 'active')
    limit 1
  `;
  if (clash.length > 0) return { ok: false, error: "This tenant already has a lease on this property." };

  const property = await db<{ id: string; owner_id: string; agent_id: string | null }[]>`
    select id, owner_id, agent_id from properties where id = ${app.id}
  `;
  const prop = property[0] ?? { id: app.id, owner_id: app.owner_id, agent_id: app.agent_id };

  const inserted = await db<{ id: string }[]>`
    insert into leases (
      tenant_id, property_id, landlord_id, agent_id, application_id,
      start_date, end_date, monthly_rent, deposit_amount, payment_day, status
    ) values (
      ${app.applicant_id}, ${prop.id}, ${prop.owner_id}, ${prop.agent_id}, ${app.id},
      ${parsed.data.startDate}, ${parsed.data.endDate}, ${parsed.data.monthlyRent},
      ${parsed.data.depositAmount}, ${parsed.data.paymentDay}, 'active'
    )
    returning id
  `;
  const leaseId = inserted[0]?.id;
  if (!leaseId) return { ok: false, error: "Could not create lease." };

  // Mark property occupied
  await db`update properties set status = 'occupied' where id = ${prop.id}`;

  // Generate rent schedule
  try {
    await createRentRecordsForLease(leaseId);
  } catch (err) {
    console.error("[lease] rent record generation failed", err);
  }

  await createNotification({
    userId: app.applicant_id,
    type: "application_approved",
    title: "Your lease is ready",
    body: `Welcome home! Your lease for ${app.title} is active from ${parsed.data.startDate}.`,
    link: "/dashboard/tenant/lease",
  });

  await audit("lease_created", "leases", leaseId, {
    property: prop.id,
    tenant: app.applicant_id,
  });

  revalidatePath("/dashboard/agent/applications");
  revalidatePath("/dashboard/tenant/lease");
  return { ok: true, leaseId };
}
