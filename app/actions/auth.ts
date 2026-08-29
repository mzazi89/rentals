"use server";

import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { audit } from "@/lib/audit";
import {
  roleSelectSchema,
  tenantOnboardingSchema,
  agentOnboardingSchema,
  landlordOnboardingSchema,
} from "@/lib/validations";
import type { z } from "zod";

type ActionResult = { ok: true; [k: string]: unknown } | { ok: false; error: string };

function err(error: unknown, fallback: string): ActionResult {
  const message = error instanceof Error ? error.message : String(error);
  return { ok: false, error: message.includes("FORBIDDEN") ? "You are not allowed to do that." : message || fallback };
}

/* ------------------------------------------------------------------ */
/* Post-signup profile creation (session-independent — never creates    */
/* orphan auth users)                                                   */
/* ------------------------------------------------------------------ */
export async function createProfileAfterSignup(input: {
  userId: string;
  email: string;
  name: string;
}): Promise<ActionResult> {
  if (!input.userId || !input.email) {
    return { ok: false, error: "Missing account details." };
  }
  await db`
    insert into profiles (id, email, full_name, role, status, is_onboarded)
    values (${input.userId}, ${input.email}, ${input.name || null}, null, 'active', false)
    on conflict (id) do nothing
  `;
  return { ok: true };
}

/* ------------------------------------------------------------------ */
/* Role selection (admin is never selectable)                         */
/* ------------------------------------------------------------------ */
export async function chooseRoleAction(values: z.infer<typeof roleSelectSchema>): Promise<ActionResult> {
  const parsed = roleSelectSchema.safeParse(values);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };

  const session = await auth.api.getSession({ headers: headers() });
  if (!session?.user) return { ok: false, error: "You must be signed in." };

  const rows = await db<{ role: string | null }[]>`select role from profiles where id = ${session.user.id}`;
  if (rows[0]?.role) return { ok: false, error: "Role has already been selected." };

  const role = parsed.data.role;
  await db`
    update profiles set role = ${role} where id = ${session.user.id}
  `;
  // Keep the auth user's role field in sync (convenient session access).
  await db`update "user" set role = ${role} where id = ${session.user.id}`;

  if (role === "tenant") {
    await db`insert into tenants (id) values (${session.user.id}) on conflict (id) do nothing`;
  } else if (role === "agent") {
    await db`insert into agents (id, verification_status) values (${session.user.id}, 'pending') on conflict (id) do nothing`;
  } else if (role === "landlord") {
    await db`insert into landlords (id) values (${session.user.id}) on conflict (id) do nothing`;
  }

  await audit("role_selected", "profiles", session.user.id, { role });
  return { ok: true, role };
}

/* ------------------------------------------------------------------ */
/* Onboarding                                                         */
/* ------------------------------------------------------------------ */
export async function completeTenantOnboarding(values: z.infer<typeof tenantOnboardingSchema>): Promise<ActionResult> {
  const parsed = tenantOnboardingSchema.safeParse(values);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };

  const session = await auth.api.getSession({ headers: headers() });
  if (!session?.user) return { ok: false, error: "You must be signed in." };
  const id = session.user.id;

  await db`
    update profiles set full_name = ${parsed.data.fullName}, phone = ${parsed.data.phone}, is_onboarded = true
    where id = ${id}
  `;
  await db`
    update tenants set
      preferred_locations = ${parsed.data.preferredLocations},
      preferred_property_type = ${parsed.data.propertyType ?? null},
      min_budget = ${parsed.data.minBudget ?? null},
      max_budget = ${parsed.data.maxBudget ?? null},
      occupation = ${parsed.data.occupation ?? null},
      employer = ${parsed.data.employer ?? null},
      monthly_income = ${parsed.data.monthlyIncome ?? null}
    where id = ${id}
  `;
  return { ok: true };
}

export async function completeAgentOnboarding(values: z.infer<typeof agentOnboardingSchema>): Promise<ActionResult> {
  const parsed = agentOnboardingSchema.safeParse(values);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };

  const session = await auth.api.getSession({ headers: headers() });
  if (!session?.user) return { ok: false, error: "You must be signed in." };
  const id = session.user.id;

  await db`
    update profiles set full_name = ${parsed.data.fullName}, phone = ${parsed.data.phone}, is_onboarded = true
    where id = ${id}
  `;
  await db`
    update agents set
      agency_name = ${parsed.data.agencyName},
      agency_phone = ${parsed.data.agencyPhone},
      agency_address = ${parsed.data.agencyAddress || null},
      years_experience = ${parsed.data.yearsExperience ?? null},
      bio = ${parsed.data.bio ?? null},
      id_number = ${parsed.data.idNumber},
      areas_served = ${parsed.data.areasServed},
      verification_status = 'pending'
    where id = ${id}
  `;
  return { ok: true };
}

export async function completeLandlordOnboarding(values: z.infer<typeof landlordOnboardingSchema>): Promise<ActionResult> {
  const parsed = landlordOnboardingSchema.safeParse(values);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };

  const session = await auth.api.getSession({ headers: headers() });
  if (!session?.user) return { ok: false, error: "You must be signed in." };
  const id = session.user.id;

  await db`
    update profiles set full_name = ${parsed.data.fullName}, phone = ${parsed.data.phone}, is_onboarded = true
    where id = ${id}
  `;
  await db`
    update landlords set company_name = ${parsed.data.companyName || null}, address = ${parsed.data.address || null}
    where id = ${id}
  `;
  return { ok: true };
}
