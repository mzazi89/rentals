"use server";

import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { rateLimit } from "@/lib/rate-limit";
import { getAppUrl } from "@/lib/env-public";
import { audit } from "@/lib/audit";
import {
  signupSchema,
  loginSchema,
  forgotPasswordSchema,
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
/* Signup (creates the auth user + profile row)                       */
/* ------------------------------------------------------------------ */
export async function signupAction(values: z.infer<typeof signupSchema>): Promise<ActionResult> {
  const parsed = signupSchema.safeParse(values);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };

  try {
    const { user, token } = await auth.api.signUpEmail({
      body: {
        email: parsed.data.email,
        password: parsed.data.password,
        name: parsed.data.fullName,
        callbackURL: "/signup/role",
      },
    });
    if (!user) return { ok: false, error: "Could not create account." };

    // Create the app profile row (role assigned in the next step).
    await db`
      insert into profiles (id, email, full_name, role, status, is_onboarded)
      values (${user.id}, ${parsed.data.email}, ${parsed.data.fullName}, null, 'active', false)
      on conflict (id) do nothing
    `;

    const requiresConfirmation = !user.emailVerified;
    return {
      ok: true,
      requiresConfirmation,
      // token is set when email confirmation is required
      message: requiresConfirmation
        ? "Check your email to confirm your account, then continue."
        : "Account created. Choose your role to continue.",
    };
  } catch (error) {
    return err(error, "Could not create account. The email may already be registered.");
  }
}

/* ------------------------------------------------------------------ */
/* Login                                                              */
/* ------------------------------------------------------------------ */
export async function loginAction(values: z.infer<typeof loginSchema>): Promise<ActionResult> {
  const parsed = loginSchema.safeParse(values);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };

  if (!rateLimit(`login:${parsed.data.email.toLowerCase()}`, 5, 60_000)) {
    return { ok: false, error: "Too many attempts. Please wait a minute and try again." };
  }

  try {
    const session = await auth.api.signInEmail({ body: { email: parsed.data.email, password: parsed.data.password } });
    if (!session?.user) return { ok: false, error: "Invalid email or password." };

    // Reject suspended accounts at login.
    const rows = await db<{ status: string }[]>`select status from profiles where id = ${session.user.id}`;
    if (rows[0]?.status === "suspended") {
      await auth.api.signOut({ headers: headers() });
      return { ok: false, error: "This account has been suspended. Contact support." };
    }
    return { ok: true };
  } catch (error) {
    const message = error instanceof Error ? error.message : "";
    if (/verif/i.test(message)) {
      return { ok: false, error: "Please verify your email address first. Check your inbox." };
    }
    if (/password/i.test(message)) {
      return { ok: false, error: "Invalid email or password." };
    }
    return { ok: false, error: "Invalid email or password." };
  }
}

export async function logoutAction(): Promise<void> {
  try {
    await auth.api.signOut({ headers: headers() });
  } catch {
    /* already signed out */
  }
}

/* ------------------------------------------------------------------ */
/* Password reset                                                     */
/* ------------------------------------------------------------------ */
export async function forgotPasswordAction(values: z.infer<typeof forgotPasswordSchema>): Promise<ActionResult> {
  const parsed = forgotPasswordSchema.safeParse(values);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };

  try {
    await auth.api.requestPasswordReset({
      body: { email: parsed.data.email, redirectTo: "/reset-password" },
    });
  } catch {
    // Never reveal whether an email exists.
  }
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
