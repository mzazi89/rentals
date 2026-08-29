"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { requireUser } from "@/lib/auth/helpers";

type ActionResult = { ok: true; favorited: boolean } | { ok: false; error: string };

/** Toggle a favorite (own user only). */
export async function toggleFavorite(propertyId: string): Promise<ActionResult> {
  const user = await requireUser();

  const existing = await db<{ user_id: string }[]>`
    select user_id from favorites where user_id = ${user.id} and property_id = ${propertyId}
  `;
  if (existing.length > 0) {
    await db`delete from favorites where user_id = ${user.id} and property_id = ${propertyId}`;
  } else {
    await db`
      insert into favorites (user_id, property_id) values (${user.id}, ${propertyId})
      on conflict do nothing
    `;
  }
  revalidatePath("/dashboard/tenant/saved");
  return { ok: true, favorited: existing.length === 0 };
}

/** Current user's favorited property ids (used to render heart states). */
export async function getMyFavoriteIds(): Promise<string[]> {
  const user = await requireUser();
  const rows = await db<{ property_id: string }[]>`select property_id from favorites where user_id = ${user.id}`;
  return rows.map((r) => r.property_id);
}

/** Fetch favorited properties with relations (tenant saved page). */
export async function getMyFavoriteProperties() {
  const user = await requireUser();
  const { fetchPropertyById } = await import("@/lib/db/queries");
  const rows = await db<{ property_id: string }[]>`
    select property_id from favorites where user_id = ${user.id} order by created_at desc
  `;
  const properties = [];
  for (const row of rows) {
    const property = await fetchPropertyById(row.property_id);
    if (property) properties.push(property);
  }
  return properties;
}
