"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { requireProfile } from "@/lib/auth/helpers";
import { isOwnerRole } from "@/lib/auth/helpers";
import { assertRole } from "@/lib/permissions";
import { makePropertySlug } from "@/lib/slug";
import { getSettings } from "@/lib/settings";
import { audit } from "@/lib/audit";
import { deleteUploadedFile } from "@/lib/storage-server";
import {
  propertyBasicSchema,
  propertyLocationSchema,
  propertyPricingSchema,
  propertySpecsSchema,
  propertyAmenitiesSchema,
} from "@/lib/validations";

type ActionResult = { ok: true; [k: string]: unknown } | { ok: false; error: string };

interface SaveStepInput {
  propertyId?: string | null;
  step: "basic" | "location" | "pricing" | "specs" | "amenities";
  title: string;
  description: string;
  propertyTypeId: string;
  county: string;
  city: string;
  neighborhood: string;
  address: string;
  latitude: number | null;
  longitude: number | null;
  monthlyRent: number;
  depositAmount: number;
  availabilityDate: string;
  bedrooms: number | null;
  bathrooms: number | null;
  size: number | null;
  furnished: boolean;
  amenityIds: string[];
}

export async function savePropertyStep(input: SaveStepInput): Promise<ActionResult> {
  const profile = await requireProfile();
  assertRole(profile, ["agent", "landlord", "owner", "admin"]);
  const id = profile.id;

  // Agents cannot create listings — the owner adds properties and assigns
  // them to agents to manage (editing assigned listings is still allowed).
  if (!input.propertyId && profile.role === "agent") {
    return { ok: false, error: "Agents cannot add properties. The owner assigns properties for you to manage." };
  }

  // Validate the current step
  try {
    if (input.step === "basic") {
      propertyBasicSchema.parse({ title: input.title, description: input.description, propertyTypeId: input.propertyTypeId });
    } else if (input.step === "location") {
      propertyLocationSchema.parse({
        county: input.county,
        city: input.city,
        neighborhood: input.neighborhood || undefined,
        address: input.address || undefined,
        latitude: input.latitude ?? undefined,
        longitude: input.longitude ?? undefined,
      });
    } else if (input.step === "pricing") {
      propertyPricingSchema.parse({
        monthlyRent: input.monthlyRent,
        depositAmount: input.depositAmount,
        availabilityDate: input.availabilityDate || undefined,
      });
    } else if (input.step === "specs") {
      propertySpecsSchema.parse({
        propertyTypeId: input.propertyTypeId,
        bedrooms: input.bedrooms ?? undefined,
        bathrooms: input.bathrooms ?? undefined,
        size: input.size ?? undefined,
        furnished: input.furnished,
      });
    } else if (input.step === "amenities") {
      propertyAmenitiesSchema.parse({ amenityIds: input.amenityIds });
    }
  } catch (err) {
    const issue = (err as { issues?: { message: string }[] }).issues?.[0];
    return { ok: false, error: issue?.message ?? "Invalid input." };
  }

  let propertyId = input.propertyId ?? null;

  if (!propertyId) {
    const newId = crypto.randomUUID();
    await db`
      insert into properties (id, owner_id, agent_id, title, slug, description, property_type_id, status, county, city, neighborhood, address)
      values (${newId}, ${id}, ${profile.role === "agent" ? id : null}, ${input.title},
        ${makePropertySlug(input.title, newId)}, ${input.description || null},
        ${input.propertyTypeId || null}, 'draft', ${input.county || "Nairobi"},
        ${input.city || null}, ${input.neighborhood || null}, ${input.address || null})
    `;
    propertyId = newId;
  }

  // Security: verify the current user can manage this property.
  const owned = await db<{ id: string }[]>`
    select id from properties where id = ${propertyId} and (owner_id = ${id} or agent_id = ${id})
  `;
  if (owned.length === 0 && !isOwnerRole(profile.role)) {
    return { ok: false, error: "You do not have permission to edit this property." };
  }

  await db`
    update properties set
      title = ${input.title},
      description = ${input.description},
      property_type_id = ${input.propertyTypeId},
      county = ${input.county},
      city = ${input.city},
      neighborhood = ${input.neighborhood},
      address = ${input.address},
      latitude = ${input.latitude},
      longitude = ${input.longitude},
      monthly_rent = ${input.monthlyRent},
      deposit_amount = ${input.depositAmount},
      availability_date = ${input.availabilityDate || null},
      bedrooms = ${input.bedrooms},
      bathrooms = ${input.bathrooms},
      size = ${input.size},
      furnished = ${input.furnished}
    where id = ${propertyId}
  `;

  if (input.step === "amenities") {
    await db`delete from property_amenities where property_id = ${propertyId}`;
    if (input.amenityIds.length > 0) {
      for (const amenityId of input.amenityIds) {
        await db`
          insert into property_amenities (property_id, amenity_id) values (${propertyId}, ${amenityId})
          on conflict do nothing
        `;
      }
    }
  }

  revalidatePath("/properties");
  return { ok: true, propertyId };
}

export async function submitPropertyForReview(propertyId: string): Promise<ActionResult> {
  const profile = await requireProfile();
  assertRole(profile, ["agent", "landlord", "owner", "admin"]);
  const settings = await getSettings();

  const property = await db<{ id: string; owner_id: string; agent_id: string | null }[]>`
    select id, owner_id, agent_id from properties where id = ${propertyId}
  `;
  if (!property[0]) return { ok: false, error: "Property not found." };
  const p = property[0];
  if (p.owner_id !== profile.id && p.agent_id !== profile.id && !isOwnerRole(profile.role)) {
    return { ok: false, error: "You do not have permission to submit this property." };
  }

  const nextStatus = settings.requirePropertyVerification ? "pending_review" : "available";
  await db`
    update properties set status = ${nextStatus}, rejection_reason = null where id = ${propertyId}
  `;

  await audit("property_submitted", "properties", propertyId);
  revalidatePath("/dashboard/agent/properties");
  revalidatePath("/properties");
  return { ok: true };
}

export async function addPropertyImage(propertyId: string, url: string): Promise<ActionResult> {
  const profile = await requireProfile();
  assertRole(profile, ["agent", "landlord", "owner", "admin"]);

  const owned = await db<{ id: string }[]>`
    select id from properties where id = ${propertyId} and (owner_id = ${profile.id} or agent_id = ${profile.id})
  `;
  if (owned.length === 0 && !isOwnerRole(profile.role)) {
    return { ok: false, error: "You do not have permission to edit this property." };
  }

  const count = await db<{ total: number }[]>`select count(*)::int as total from property_images where property_id = ${propertyId}`;
  if ((count[0]?.total ?? 0) >= 10) return { ok: false, error: "Maximum 10 images per property." };

  const inserted = await db<{ id: string }[]>`
    insert into property_images (property_id, url, position, is_primary)
    values (${propertyId}, ${url}, ${count[0]?.total ?? 0}, ${(count[0]?.total ?? 0) === 0})
    returning id
  `;
  revalidatePath("/properties");
  return { ok: true, imageId: inserted[0]?.id };
}

export async function removePropertyImage(imageId: string, url: string): Promise<ActionResult> {
  const profile = await requireProfile();
  assertRole(profile, ["agent", "landlord", "owner", "admin"]);

  const row = await db<{ property_id: string }[]>`select property_id from property_images where id = ${imageId}`;
  if (row[0]) {
    const owned = await db<{ id: string }[]>`
      select id from properties where id = ${row[0].property_id} and (owner_id = ${profile.id} or agent_id = ${profile.id})
    `;
    if (owned.length === 0 && !isOwnerRole(profile.role)) {
      return { ok: false, error: "You do not have permission to edit this property." };
    }
    await db`delete from property_images where id = ${imageId}`;
  }
  await deleteUploadedFile(url);
  revalidatePath("/properties");
  return { ok: true };
}

export async function setPrimaryImage(imageId: string, propertyId: string): Promise<ActionResult> {
  const profile = await requireProfile();
  assertRole(profile, ["agent", "landlord", "owner", "admin"]);

  const owned = await db<{ id: string }[]>`
    select id from properties where id = ${propertyId} and (owner_id = ${profile.id} or agent_id = ${profile.id})
  `;
  if (owned.length === 0 && !isOwnerRole(profile.role)) {
    return { ok: false, error: "You do not have permission to edit this property." };
  }

  await db`update property_images set is_primary = false where property_id = ${propertyId}`;
  await db`update property_images set is_primary = true where id = ${imageId}`;
  revalidatePath("/properties");
  return { ok: true };
}

export async function deleteProperty(propertyId: string): Promise<ActionResult> {
  const profile = await requireProfile();
  assertRole(profile, ["agent", "landlord", "owner", "admin"]);

  const owned = await db<{ id: string }[]>`
    select id from properties where id = ${propertyId} and (owner_id = ${profile.id} or agent_id = ${profile.id})
  `;
  if (owned.length === 0 && !isOwnerRole(profile.role)) {
    return { ok: false, error: "You do not have permission to delete this property." };
  }

  const leases = await db<{ id: string }[]>`
    select id from leases where property_id = ${propertyId} and status in ('active', 'pending')
  `;
  if (leases.length > 0) {
    return { ok: false, error: "This property has active leases. Deactivate it instead of deleting." };
  }

  const images = await db<{ url: string }[]>`select url from property_images where property_id = ${propertyId}`;
  await db`delete from properties where id = ${propertyId}`;
  for (const img of images) await deleteUploadedFile(img.url);

  await audit("property_deleted", "properties", propertyId);
  revalidatePath("/dashboard/agent/properties");
  revalidatePath("/properties");
  return { ok: true };
}

export async function deactivateProperty(propertyId: string): Promise<ActionResult> {
  const profile = await requireProfile();
  assertRole(profile, ["agent", "landlord", "owner", "admin"]);

  const owned = await db<{ id: string }[]>`
    select id from properties where id = ${propertyId} and (owner_id = ${profile.id} or agent_id = ${profile.id})
  `;
  if (owned.length === 0 && !isOwnerRole(profile.role)) {
    return { ok: false, error: "You do not have permission to update this property." };
  }

  const current = await db<{ status: string }[]>`select status from properties where id = ${propertyId}`;
  await db`
    update properties set status = ${current[0]?.status === "inactive" ? "draft" : "inactive"}
    where id = ${propertyId}
  `;
  revalidatePath("/dashboard/agent/properties");
  revalidatePath("/properties");
  return { ok: true };
}
