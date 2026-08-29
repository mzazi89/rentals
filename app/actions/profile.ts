"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { requireProfile } from "@/lib/auth/helpers";
import { audit } from "@/lib/audit";
import {
  profileSettingsSchema,
  notificationPrefsSchema,
  agencySettingsSchema,
} from "@/lib/validations";
import type { z } from "zod";

type ActionResult = { ok: true; [k: string]: unknown } | { ok: false; error: string };

export async function updateProfileSettings(
  values: z.infer<typeof profileSettingsSchema>
): Promise<ActionResult> {
  const profile = await requireProfile();
  const parsed = profileSettingsSchema.safeParse(values);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };

  await db`
    update profiles set
      full_name = ${parsed.data.fullName},
      phone = ${parsed.data.phone ?? null},
      avatar_url = ${parsed.data.avatarUrl ?? null}
    where id = ${profile.id}
  `;
  revalidatePath("/dashboard", "layout");
  return { ok: true };
}

export async function updatePassword(values: { currentPassword?: string; newPassword: string }): Promise<ActionResult> {
  const profile = await requireProfile();
  if (!values.newPassword || values.newPassword.length < 8) {
    return { ok: false, error: "Password must be at least 8 characters." };
  }
  const { auth } = await import("@/lib/auth");
  const { headers } = await import("next/headers");
  try {
    await auth.api.changePassword({
      headers: headers(),
      body: { newPassword: values.newPassword, currentPassword: values.currentPassword ?? "" },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "";
    return { ok: false, error: message || "Could not update password." };
  }
  await audit("password_changed", "profiles", profile.id);
  return { ok: true };
}

export async function updateNotificationPrefs(
  values: z.infer<typeof notificationPrefsSchema>
): Promise<ActionResult> {
  const profile = await requireProfile();
  const parsed = notificationPrefsSchema.safeParse(values);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };

  await db`
    insert into notification_preferences (
      user_id, notify_viewing, notify_application, notify_payment, notify_rent,
      notify_message, notify_system, email_enabled, in_app_enabled
    ) values (
      ${profile.id}, ${parsed.data.notifyViewing}, ${parsed.data.notifyApplication},
      ${parsed.data.notifyPayment}, ${parsed.data.notifyRent}, ${parsed.data.notifyMessage},
      ${parsed.data.notifySystem}, ${parsed.data.emailEnabled}, ${parsed.data.inAppEnabled}
    )
    on conflict (user_id) do update set
      notify_viewing = excluded.notify_viewing,
      notify_application = excluded.notify_application,
      notify_payment = excluded.notify_payment,
      notify_rent = excluded.notify_rent,
      notify_message = excluded.notify_message,
      notify_system = excluded.notify_system,
      email_enabled = excluded.email_enabled,
      in_app_enabled = excluded.in_app_enabled
  `;
  revalidatePath("/dashboard", "layout");
  return { ok: true };
}

export async function updateAgencySettings(values: z.infer<typeof agencySettingsSchema>): Promise<ActionResult> {
  const profile = await requireProfile();
  if (profile.role !== "agent") return { ok: false, error: "Only agents can update agency settings." };
  const parsed = agencySettingsSchema.safeParse(values);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };

  await db`
    update agents set
      agency_name = ${parsed.data.agencyName},
      agency_phone = ${parsed.data.agencyPhone},
      agency_address = ${parsed.data.agencyAddress},
      bio = ${parsed.data.bio ?? null},
      areas_served = ${parsed.data.areasServed},
      is_available = ${parsed.data.isAvailable}
    where id = ${profile.id}
  `;
  revalidatePath("/dashboard/agent/profile");
  return { ok: true };
}

export async function updateTenantDetails(values: {
  preferredLocations: string[];
  propertyType?: string;
  minBudget?: number;
  maxBudget?: number;
  occupation?: string;
  employer?: string;
  monthlyIncome?: number;
}): Promise<ActionResult> {
  const profile = await requireProfile();
  if (profile.role !== "tenant") return { ok: false, error: "Only tenants can update these details." };

  await db`
    update tenants set
      preferred_locations = ${values.preferredLocations},
      preferred_property_type = ${values.propertyType ?? null},
      min_budget = ${values.minBudget ?? null},
      max_budget = ${values.maxBudget ?? null},
      occupation = ${values.occupation ?? null},
      employer = ${values.employer ?? null},
      monthly_income = ${values.monthlyIncome ?? null}
    where id = ${profile.id}
  `;
  revalidatePath("/dashboard/tenant/settings");
  return { ok: true };
}
