"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { requireProfile } from "@/lib/auth/helpers";
import { assertRole, canManageProperty } from "@/lib/permissions";
import { z } from "zod";

type ActionResult = { ok: true; [k: string]: unknown } | { ok: false; error: string };

/* ------------------------------------------------------------------ */
/* Floors                                                             */
/* ------------------------------------------------------------------ */
export async function addFloor(propertyId: string, name: string): Promise<ActionResult> {
  const profile = await requireProfile();
  assertRole(profile, ["landlord", "agent", "owner", "admin"]);
  if (!(await canManageProperty(profile, propertyId))) {
    return { ok: false, error: "You do not have permission to manage this property." };
  }
  const clean = name.trim();
  if (!clean) return { ok: false, error: "Floor name is required." };
  if (clean.length > 60) return { ok: false, error: "Floor name is too long." };

  const position = await db<{ n: number }[]>`select count(*)::int as n from building_floors where property_id = ${propertyId}`;
  await db`
    insert into building_floors (property_id, name, position)
    values (${propertyId}, ${clean}, ${position[0]?.n ?? 0})
  `;
  revalidatePath("/dashboard");
  return { ok: true };
}

export async function renameFloor(floorId: string, name: string): Promise<ActionResult> {
  const profile = await requireProfile();
  assertRole(profile, ["landlord", "agent", "owner", "admin"]);
  const floor = await db<{ property_id: string }[]>`select property_id from building_floors where id = ${floorId}`;
  if (!floor[0] || !(await canManageProperty(profile, floor[0].property_id))) {
    return { ok: false, error: "You do not have permission to manage this property." };
  }
  const clean = name.trim();
  if (!clean || clean.length > 60) return { ok: false, error: "Invalid floor name." };
  await db`update building_floors set name = ${clean} where id = ${floorId}`;
  revalidatePath("/dashboard");
  return { ok: true };
}

export async function deleteFloor(floorId: string): Promise<ActionResult> {
  const profile = await requireProfile();
  assertRole(profile, ["landlord", "agent", "owner", "admin"]);
  const floor = await db<{ property_id: string }[]>`select property_id from building_floors where id = ${floorId}`;
  if (!floor[0] || !(await canManageProperty(profile, floor[0].property_id))) {
    return { ok: false, error: "You do not have permission to manage this property." };
  }
  await db`delete from building_floors where id = ${floorId}`;
  revalidatePath("/dashboard");
  return { ok: true };
}

/* ------------------------------------------------------------------ */
/* Units                                                              */
/* ------------------------------------------------------------------ */
const unitStatusSchema = z.enum(["available", "reserved", "occupied", "inactive"]);

export async function addUnit(input: {
  propertyId: string;
  floorId?: string | null;
  unitNumber: string;
}): Promise<ActionResult> {
  const profile = await requireProfile();
  assertRole(profile, ["landlord", "agent", "owner", "admin"]);
  if (!(await canManageProperty(profile, input.propertyId))) {
    return { ok: false, error: "You do not have permission to manage this property." };
  }
  const number = input.unitNumber.trim();
  if (!number) return { ok: false, error: "Unit number is required." };
  if (number.length > 30) return { ok: false, error: "Unit number is too long." };

  try {
    await db`
      insert into building_units (property_id, floor_id, unit_number, status)
      values (${input.propertyId}, ${input.floorId ?? null}, ${number}, 'available')
    `;
  } catch (err) {
    const message = err instanceof Error ? err.message : "";
    if (message.includes("duplicate key")) {
      return { ok: false, error: `Unit "${number}" already exists in this building.` };
    }
    return { ok: false, error: message || "Could not add unit." };
  }
  revalidatePath("/dashboard");
  return { ok: true };
}

export async function updateUnitStatus(unitId: string, status: string): Promise<ActionResult> {
  const profile = await requireProfile();
  assertRole(profile, ["landlord", "agent", "owner", "admin"]);
  const parsed = unitStatusSchema.safeParse(status);
  if (!parsed.success) return { ok: false, error: "Invalid status." };

  const unit = await db<{ property_id: string }[]>`select property_id from building_units where id = ${unitId}`;
  if (!unit[0] || !(await canManageProperty(profile, unit[0].property_id))) {
    return { ok: false, error: "You do not have permission to manage this property." };
  }
  await db`update building_units set status = ${parsed.data} where id = ${unitId}`;
  revalidatePath("/dashboard");
  return { ok: true };
}

export async function renameUnit(unitId: string, unitNumber: string): Promise<ActionResult> {
  const profile = await requireProfile();
  assertRole(profile, ["landlord", "agent", "owner", "admin"]);
  const unit = await db<{ property_id: string }[]>`select property_id from building_units where id = ${unitId}`;
  if (!unit[0] || !(await canManageProperty(profile, unit[0].property_id))) {
    return { ok: false, error: "You do not have permission to manage this property." };
  }
  const number = unitNumber.trim();
  if (!number || number.length > 30) return { ok: false, error: "Invalid unit number." };
  try {
    await db`update building_units set unit_number = ${number} where id = ${unitId}`;
  } catch {
    return { ok: false, error: "A unit with that number already exists." };
  }
  revalidatePath("/dashboard");
  return { ok: true };
}

export async function deleteUnit(unitId: string): Promise<ActionResult> {
  const profile = await requireProfile();
  assertRole(profile, ["landlord", "agent", "owner", "admin"]);
  const unit = await db<{ property_id: string }[]>`select property_id from building_units where id = ${unitId}`;
  if (!unit[0] || !(await canManageProperty(profile, unit[0].property_id))) {
    return { ok: false, error: "You do not have permission to manage this property." };
  }
  await db`delete from building_units where id = ${unitId}`;
  revalidatePath("/dashboard");
  return { ok: true };
}
