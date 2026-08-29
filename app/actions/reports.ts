"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { requireProfile } from "@/lib/auth/helpers";
import { reportCreateSchema } from "@/lib/validations";
import type { z } from "zod";

type ActionResult = { ok: true; [k: string]: unknown } | { ok: false; error: string };

/** Any authenticated user can report a property or user. */
export async function createReport(values: z.infer<typeof reportCreateSchema>): Promise<ActionResult> {
  const profile = await requireProfile();
  const parsed = reportCreateSchema.safeParse(values);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };

  await db`
    insert into reports (reporter_id, reported_user_id, property_id, reason, description, status)
    values (${profile.id}, ${parsed.data.reportedUserId ?? null}, ${parsed.data.propertyId ?? null},
      ${parsed.data.reason}, ${parsed.data.description}, 'open')
  `;

  revalidatePath("/");
  return { ok: true };
}
